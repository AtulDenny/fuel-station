import { useState, useEffect } from 'react';
import { getReceiptsByEmployee } from '../services/receipt';

const EmployeeReceiptInfo = ({ employeeId }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const loadReceipts = async () => {
      if (!employeeId) return;
      
      setLoading(true);
      try {
        const data = await getReceiptsByEmployee(employeeId);
        setReceipts(data);
        setError('');
      } catch (err) {
        console.error(`Error loading receipts for employee ${employeeId}:`, err);
        setError('Failed to load employee receipts');
      } finally {
        setLoading(false);
      }
    };
    
    loadReceipts();
  }, [employeeId]);
  
  if (loading) {
    return <p className="text-sm text-gray-500">Loading receipt data...</p>;
  }
  
  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }
  
  if (receipts.length === 0) {
    return <p className="text-sm text-gray-500">No receipt data available</p>;
  }

  return (
    <div className="mt-3 border-t pt-3">
      <p className="text-xs text-gray-500 mb-1">Receipt Activities</p>
      <div className="text-sm">
        <p className="flex justify-between mb-1">
          <span className="text-gray-600">Recent Activity:</span>
          <span className="font-medium">
            {receipts[0].printDate || new Date(receipts[0].uploadDate).toLocaleDateString()}
          </span>
        </p>
        <p className="flex justify-between mb-1">
          <span className="text-gray-600">Total Receipts:</span>
          <span className="font-medium">{receipts.length}</span>
        </p>
        <p className="flex justify-between mb-1">
          <span className="text-gray-600">Last Pump Used:</span>
          <span className="font-medium">
            {receipts[0].machine ? receipts[0].machine.name : 
             receipts[0].pumpSerialNumber || 'Unknown'}
          </span>
        </p>
        {receipts[0].nozzles && receipts[0].nozzles.length > 0 && (
          <p className="flex justify-between mb-1">
            <span className="text-gray-600">Last Sale Amount:</span>
            <span className="font-medium">
              ₹{receipts[0].nozzles.reduce((sum, nozzle) => 
                sum + (parseInt(nozzle.totalSales) || 0), 0)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default EmployeeReceiptInfo;