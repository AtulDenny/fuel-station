// src/components/FuelDashboard.jsx (Updated to include Receipts tab)
import { useState, useEffect } from 'react';
import { getFuelEntries, getFuelStats, seedAllData } from '../services/fuel';
import FuelTable from './FuelTable';
import AddFuelForm from './AddFuelForm';
import MachineStats from './MachineStats';
import EmployeeStats from './EmployeeStats';
import ReceiptsTab from './ReceiptsTab';

const FuelDashboard = () => {
  const [fuelEntries, setFuelEntries] = useState([]);
  const [fuelStats, setFuelStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('all');

  // Calculate summary data
  const calculateSummary = () => {
    if (!fuelEntries.length) return { totalCost: 0, totalQuantity: 0, avgPrice: 0 };
    
    const totalCost = fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.totalCost), 0);
    const totalQuantity = fuelEntries.reduce((sum, entry) => sum + entry.quantity, 0);
    const avgPrice = totalQuantity ? (totalCost / totalQuantity).toFixed(2) : 0;
    
    return {
      totalCost: totalCost.toFixed(2),
      totalQuantity: totalQuantity.toFixed(2),
      avgPrice
    };
  };

  // Get summary from stats or calculate from entries
  const getSummary = () => {
    if (fuelStats && fuelStats.overall) {
      return {
        totalCost: fuelStats.overall.totalCost.toFixed(2),
        totalQuantity: fuelStats.overall.totalQuantity.toFixed(2),
        avgPrice: fuelStats.overall.avgPrice
      };
    }
    return calculateSummary();
  };

  const { totalCost, totalQuantity, avgPrice } = getSummary();

  // Fetch fuel entries
  const loadFuelEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getFuelEntries();
      setFuelEntries(data);
    } catch (err) {
      console.error('Error fetching fuel entries:', err);
      setError('Failed to load fuel data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch fuel statistics
  const loadFuelStats = async () => {
    try {
      const stats = await getFuelStats(period);
      setFuelStats(stats);
    } catch (err) {
      console.error('Error fetching fuel stats:', err);
      // Don't set error, as this is supplementary data
    }
  };

  // Add seed data - machines, employees, and fuel entries
  const handleSeedData = async () => {
    setSeedLoading(true);
    try {
      await seedAllData();
      await Promise.all([
        loadFuelEntries(),
        loadFuelStats()
      ]);
    } catch (err) {
      console.error('Error seeding data:', err);
      setError('Failed to seed data. Please try again.');
    } finally {
      setSeedLoading(false);
    }
  };

  // Handle new fuel entry added
  const handleFuelAdded = (newEntry) => {
    console.log('New entry added:', newEntry);
    // Refresh all data
    Promise.all([
      loadFuelEntries(),
      loadFuelStats()
    ]);
  };
  
  // Handle period change
  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  // Load fuel entries and stats on component mount and when period changes
  useEffect(() => {
    const loadData = async () => {
      await loadFuelEntries();
      await loadFuelStats();
    };
    
    loadData();
  }, [period]);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex flex-wrap justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Fuel Tracking</h3>
          
          <div className="flex items-center space-x-2">
            <select
              value={period}
              onChange={handlePeriodChange}
              className="px-3 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1 ${
                  activeTab === 'overview' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('machines')}
                className={`px-3 py-1 ${
                  activeTab === 'machines' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pumps
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`px-3 py-1 ${
                  activeTab === 'employees' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Employees
              </button>
              <button
                onClick={() => setActiveTab('receipts')}
                className={`px-3 py-1 ${
                  activeTab === 'receipts' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Receipts
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Cards - Only show for non-receipt tabs */}
      {activeTab !== 'receipts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h4 className="text-sm font-medium text-blue-700 mb-1">Total Fuel Cost</h4>
            <p className="text-2xl font-bold text-blue-800">₹{totalCost}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <h4 className="text-sm font-medium text-green-700 mb-1">Total Quantity</h4>
            <p className="text-2xl font-bold text-green-800">{totalQuantity} L</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <h4 className="text-sm font-medium text-purple-700 mb-1">Average Price</h4>
            <p className="text-2xl font-bold text-purple-800">₹{avgPrice}/L</p>
          </div>
        </div>
      )}
      
      <div className="p-6 pt-0">
        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <>
            {/* Action buttons */}
            <div className="flex justify-between items-center mb-6">
              <AddFuelForm onFuelAdded={handleFuelAdded} />
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    loadFuelEntries();
                    loadFuelStats();
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  Refresh
                </button>
                
                <button
                  onClick={handleSeedData}
                  disabled={seedLoading}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-70"
                >
                  {seedLoading ? 'Adding...' : 'Seed Data'}
                </button>
              </div>
            </div>
            
            {/* Fuel Type Distribution (from stats) */}
            {fuelStats && fuelStats.fuelTypes && fuelStats.fuelTypes.length > 0 && (
              <div className="mb-6 bg-white shadow rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-3">Fuel Type Distribution</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fuelStats.fuelTypes.map((fuelType, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fuelType.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fuelType.quantity} L</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{fuelType.cost}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fuelType.count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{fuelType.avgPrice}/L</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Shift Distribution (from stats) */}
            {fuelStats && fuelStats.shifts && fuelStats.shifts.length > 0 && (
              <div className="mb-6 bg-white shadow rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-3">Shift Distribution</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fuelStats.shifts.map((shift, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shift.shift}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shift.quantity} L</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{shift.cost}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shift.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {/* Loading state */}
            {loading ? (
              <div className="text-center py-6">
                <p className="text-gray-600">Loading fuel data...</p>
              </div>
            ) : (
              <FuelTable 
                fuelEntries={fuelEntries}
                setFuelEntries={setFuelEntries}
              />
            )}
          </>
        )}
        
        {/* Machines Tab */}
        {activeTab === 'machines' && (
          <MachineStats />
        )}
        
        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <EmployeeStats />
        )}
        
        {/* Receipts Tab */}
        {activeTab === 'receipts' && (
          <ReceiptsTab />
        )}
      </div>
    </div>
  );
};

export default FuelDashboard;