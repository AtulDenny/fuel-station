import { useState, useEffect } from 'react';
import { getReceipts } from '../services/receipt';

const ReceiptSummary = () => {
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const loadReceipts = async () => {
      setLoading(true);
      try {
        const data = await getReceipts();
        setRecentReceipts(data.slice(0, 5)); // Get 5 most recent receipts
        setError('');
      } catch (err) {
        console.error('Error loading receipts:', err);
        setError('Failed to load recent receipts');
      } finally {
        setLoading(false);
      }
    };
    
    loadReceipts();
  }, []);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Recent Receipts</h3>
        <div className="text-center py-4">
          <p className="text-gray-600">Loading receipt data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Recent Receipts</h3>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }
  
  if (recentReceipts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Recent Receipts</h3>
        <div className="text-center py-4">
          <p className="text-gray-600">No receipts found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Recent Processed Receipts</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pump</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nozzles</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentReceipts.map((receipt) => {
              // Calculate total sales from all nozzles
              const totalSales = receipt.nozzles && receipt.nozzles.length > 0 ? 
                receipt.nozzles.reduce((sum, nozzle) => sum + (parseInt(nozzle.totalSales) || 0), 0) : 0;
                
              return (
                <tr key={receipt._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {receipt.printDate || new Date(receipt.uploadDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {receipt.machine ? receipt.machine.name : receipt.pumpSerialNumber || 'N/A'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {receipt.employee ? receipt.employee.name : receipt.employeeName || 'N/A'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {receipt.nozzles && receipt.nozzles.length > 0 ? 
                      receipt.nozzles.map(n => n.nozzleNumber).join(', ') : 'N/A'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{totalSales}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReceiptSummary;