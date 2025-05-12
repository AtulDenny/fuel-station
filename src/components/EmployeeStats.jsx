// src/components/EmployeeStats.jsx
import { useState, useEffect } from 'react';
import { getEmployees } from '../services/employee';
import { getFuelByEmployee } from '../services/fuel';

const EmployeeStats = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employeeStats, setEmployeeStats] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  
  // Load employees and their stats
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch employees
        const employeesData = await getEmployees();
        setEmployees(employeesData);
        
        // Fetch stats for each employee
        const statsData = {};
        
        // Process in parallel using Promise.all
        await Promise.all(employeesData.map(async (employee) => {
          try {
            const fuelData = await getFuelByEmployee(employee.employeeId, selectedPeriod);
            
            // Calculate stats
            const totalQuantity = fuelData.reduce((sum, entry) => sum + entry.quantity, 0);
            const totalCost = fuelData.reduce((sum, entry) => sum + parseFloat(entry.totalCost), 0);
            
            statsData[employee.employeeId] = {
              totalQuantity: totalQuantity.toFixed(2),
              totalCost: totalCost.toFixed(2),
              transactionCount: fuelData.length,
              shiftDistribution: calculateShiftDistribution(fuelData),
              lastTransaction: fuelData.length > 0 ? new Date(fuelData[0].date) : null
            };
          } catch (err) {
            console.error(`Error fetching stats for employee ${employee.employeeId}:`, err);
            statsData[employee.employeeId] = { error: err.message };
          }
        }));
        
        setEmployeeStats(statsData);
      } catch (err) {
        console.error('Error loading employee stats:', err);
        setError(err.message || 'Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [selectedPeriod]);
  
  // Helper to calculate shift distribution
  const calculateShiftDistribution = (fuelData) => {
    const shifts = {
      Morning: 0,
      Afternoon: 0,
      Evening: 0,
      Night: 0
    };
    
    fuelData.forEach(entry => {
      if (shifts[entry.shift] !== undefined) {
        shifts[entry.shift]++;
      } else {
        shifts.Morning++; // Default to morning if shift is not specified
      }
    });
    
    return Object.entries(shifts)
      .filter(([_, count]) => count > 0)
      .map(([shift, count]) => ({
        shift,
        count
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
  
  if (loading && employees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Employee Performance</h3>
        <div className="text-center py-6">
          <p className="text-gray-600">Loading employee data...</p>
        </div>
      </div>
    );
  }
  
  if (error && employees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Employee Performance</h3>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Employee Performance</h3>
        
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
      
      {employees.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-600">No employees found. Add employees first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(employee => (
            <div 
              key={employee._id}
              className={`border rounded-lg p-4 ${
                employee.status === 'Active' 
                  ? 'border-blue-200 bg-blue-50' 
                  : employee.status === 'On Leave'
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-lg">{employee.name}</h4>
                  <p className="text-sm text-gray-600">{employee.employeeId} · {employee.position}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  employee.status === 'Active' 
                    ? 'bg-blue-200 text-blue-800' 
                    : employee.status === 'On Leave'
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-gray-200 text-gray-800'
                }`}>
                  {employee.status}
                </span>
              </div>
              
              {loading ? (
                <p className="text-center text-sm text-gray-500 mt-3">Loading stats...</p>
              ) : employeeStats[employee.employeeId]?.error ? (
                <p className="text-center text-sm text-red-500 mt-3">
                  Error: {employeeStats[employee.employeeId].error}
                </p>
              ) : (
                <div className="mt-3">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs text-gray-500">Total Fuel Served</p>
                      <p className="font-bold">
                        {employeeStats[employee.employeeId]?.totalQuantity || '0'} L
                      </p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-xs text-gray-500">Total Sales</p>
                      <p className="font-bold">
                        ₹{employeeStats[employee.employeeId]?.totalCost || '0'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <p className="flex justify-between mb-1">
                      <span className="text-gray-600">Transactions:</span>
                      <span className="font-medium">{employeeStats[employee.employeeId]?.transactionCount || '0'}</span>
                    </p>
                    <p className="flex justify-between mb-1">
                      <span className="text-gray-600">Last Transaction:</span>
                      <span className="font-medium">
                        {formatDate(employeeStats[employee.employeeId]?.lastTransaction)}
                      </span>
                    </p>
                  </div>
                  
                  {/* Shift Distribution */}
                  {employeeStats[employee.employeeId]?.shiftDistribution?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Shift Distribution</p>
                      {employeeStats[employee.employeeId].shiftDistribution.map(shift => (
                        <div key={shift.shift} className="flex justify-between text-sm mb-1">
                          <span>{shift.shift}:</span>
                          <span className="font-medium">{shift.count} transactions</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeStats;