import { useState, useEffect } from 'react';
import { getMachines } from '../services/machine';
import { getFuelByMachine } from '../services/fuel';
import MachineReceiptInfo from './MachineReceiptInfo';

const MachineStats = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [machineStats, setMachineStats] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  
  // Load machines and their stats
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch machines
        const machinesData = await getMachines();
        setMachines(machinesData);
        
        // Fetch stats for each machine
        const statsData = {};
        
        // Process in parallel using Promise.all
        await Promise.all(machinesData.map(async (machine) => {
          try {
            const fuelData = await getFuelByMachine(machine.machineId, selectedPeriod);
            
            // Calculate stats
            const totalQuantity = fuelData.reduce((sum, entry) => sum + entry.quantity, 0);
            const totalCost = fuelData.reduce((sum, entry) => sum + parseFloat(entry.totalCost), 0);
            const avgPrice = totalQuantity ? (totalCost / totalQuantity).toFixed(2) : 0;
            
            statsData[machine.machineId] = {
              totalQuantity: totalQuantity.toFixed(2),
              totalCost: totalCost.toFixed(2),
              avgPrice,
              fuelCount: fuelData.length,
              fuelTypes: calculateFuelTypes(fuelData),
              lastFilled: fuelData.length > 0 ? new Date(fuelData[0].date) : null
            };
          } catch (err) {
            console.error(`Error fetching stats for machine ${machine.machineId}:`, err);
            statsData[machine.machineId] = { error: err.message };
          }
        }));
        
        setMachineStats(statsData);
      } catch (err) {
        console.error('Error loading machine stats:', err);
        setError(err.message || 'Failed to load machine data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedPeriod]);
  
  // Helper to calculate fuel type distribution
  const calculateFuelTypes = (fuelData) => {
    const result = {};
    fuelData.forEach(entry => {
      if (!result[entry.fuelType]) {
        result[entry.fuelType] = 0;
      }
      result[entry.fuelType] += entry.quantity;
    });
    
    return Object.entries(result).map(([type, qty]) => ({
      type,
      quantity: parseFloat(qty.toFixed(2))
    }));
  };
  
  // Format date
  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Handle period change
  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };
  
  if (loading && machines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Pump Unit Statistics</h3>
        <div className="text-center py-6">
          <p className="text-gray-600">Loading pump unit data...</p>
        </div>
      </div>
    );
  }
  
  if (error && machines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Pump Unit Statistics</h3>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Pump Unit Statistics</h3>
        
        <div>
          <select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>
      
      {machines.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-600">No pump units found. Add machines first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map(machine => (
            <div 
              key={machine._id}
              className={`border rounded-lg p-4 ${
                machine.status === 'Active' 
                  ? 'border-green-200 bg-green-50' 
                  : machine.status === 'Maintenance'
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-lg">{machine.name}</h4>
                  <p className="text-sm text-gray-600">{machine.machineId} · {machine.location}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  machine.status === 'Active' 
                    ? 'bg-green-200 text-green-800' 
                    : machine.status === 'Maintenance'
                      ? 'bg-orange-200 text-orange-800'
                      : 'bg-red-200 text-red-800'
                }`}>
                  {machine.status}
                </span>
              </div>
              
              {loading ? (
                <p className="text-center text-sm text-gray-500 mt-3">Loading stats...</p>
              ) : machineStats[machine.machineId]?.error ? (
                <p className="text-center text-sm text-red-500 mt-3">
                  Error: {machineStats[machine.machineId].error}
                </p>
              ) : (
                <div className="mt-3">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs text-gray-500">Total Fuel</p>
                      <p className="font-bold">
                        {machineStats[machine.machineId]?.totalQuantity || '0'} L
                      </p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs text-gray-500">Total Revenue</p>
                      <p className="font-bold">
                        ₹{machineStats[machine.machineId]?.totalCost || '0'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <p className="flex justify-between mb-1">
                      <span className="text-gray-600">Avg. Price:</span>
                      <span className="font-medium">₹{machineStats[machine.machineId]?.avgPrice || '0'}/L</span>
                    </p>
                    <p className="flex justify-between mb-1">
                      <span className="text-gray-600">Transactions:</span>
                      <span className="font-medium">{machineStats[machine.machineId]?.fuelCount || '0'}</span>
                    </p>
                    <p className="flex justify-between mb-1">
                      <span className="text-gray-600">Last Filled:</span>
                      <span className="font-medium">
                        {formatDate(machineStats[machine.machineId]?.lastFilled)}
                      </span>
                    </p>
                  </div>
                  
                  {/* Fuel Type Distribution */}
                  {machineStats[machine.machineId]?.fuelTypes?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Fuel Type Distribution</p>
                      {machineStats[machine.machineId].fuelTypes.map(fuel => (
                        <div key={fuel.type} className="flex justify-between text-sm mb-1">
                          <span>{fuel.type}:</span>
                          <span className="font-medium">{fuel.quantity} L</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Machine Receipt Info */}
                  <MachineReceiptInfo machineId={machine.machineId} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MachineStats;