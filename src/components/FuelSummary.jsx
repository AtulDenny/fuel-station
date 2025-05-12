// src/components/FuelSummary.jsx
import { useState, useEffect } from 'react';
import { getFuelStats } from '../services/fuel';

const FuelSummary = ({ period }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await getFuelStats(period);
        setStats(data);
        setError('');
      } catch (err) {
        console.error('Error loading fuel stats:', err);
        setError('Failed to load fuel statistics');
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [period]);
  
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="text-center py-4">
          <p className="text-gray-600">Loading fuel statistics...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }
  
  if (!stats || !stats.overall) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="text-center py-4">
          <p className="text-gray-600">No fuel data available for the selected period.</p>
        </div>
      </div>
    );
  }

  // Format period for display
  const formatPeriodTitle = () => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Fuel Summary - {formatPeriodTitle()}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Key metrics cards */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <p className="text-sm text-blue-700 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-900">₹{parseFloat(stats.overall.totalCost).toFixed(2)}</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <p className="text-sm text-green-700 mb-1">Total Quantity</p>
          <p className="text-2xl font-bold text-green-900">{parseFloat(stats.overall.totalQuantity).toFixed(2)} L</p>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <p className="text-sm text-amber-700 mb-1">Avg. Price</p>
          <p className="text-2xl font-bold text-amber-900">₹{stats.overall.avgPrice}/L</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <p className="text-sm text-purple-700 mb-1">Transactions</p>
          <p className="text-2xl font-bold text-purple-900">{stats.overall.transactionCount}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Type Distribution */}
        {stats.fuelTypes && stats.fuelTypes.length > 0 && (
          <div>
            <h4 className="text-md font-semibold mb-3">Fuel Type Distribution</h4>
            <div className="overflow-hidden bg-gray-50 rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.fuelTypes.map((fuel, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{fuel.type}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{fuel.quantity} L</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">₹{fuel.cost}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">₹{fuel.avgPrice}/L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Shift Distribution */}
        {stats.shifts && stats.shifts.length > 0 && (
          <div>
            <h4 className="text-md font-semibold mb-3">Shift Distribution</h4>
            <div className="overflow-hidden bg-gray-50 rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.shifts.map((shift, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{shift.shift}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{shift.quantity} L</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">₹{shift.cost}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{shift.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-right text-xs text-gray-500">
        {stats.machineCount > 0 && stats.employeeCount > 0 && (
          <p>Data from {stats.machineCount} pump unit(s) and {stats.employeeCount} employee(s)</p>
        )}
      </div>
    </div>
  );
};

export default FuelSummary;