import { useState, useEffect } from 'react';
import { getReceiptsByMachine } from '../services/receipt';

const MachineReceiptInfo = ({ machineId }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const loadReceipts = async () => {
      if (!machineId) return;
      
      setLoading(true);
      try {
        const data = await getReceiptsByMachine(machineId);
        setReceipts(data);
        setError('');
      } catch (err) {
        console.error(`Error loading receipts for machine ${machineId}:`, err);
        setError('Failed to load machine receipts');
      } finally {
        setLoading(false);
      }
    };
    
    loadReceipts();
  }, [machineId]);
  
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
      <p className="text-xs text-gray-500 mb-1">Recent Receipt Data</p>
      <div className="text-sm">
        <p className="flex justify-between mb-1">
          <span className="text-gray-600">Last Receipt:</span>
          <span className="font-medium">
            {receipts[0].printDate || new Date(receipts[0].uploadDate).toLocaleDateString()}
          </span>
        </p>
        <p className="flex justify-between mb-1">
          <span className="text-gray-600">Total Receipts:</span>
          <span className="font-medium">{receipts.length}</span>
        </p>
        <p className="flex justify-between mb-1">
          <span className="text-gray-600">Last Operator:</span>
          <span className="font-medium">
            {receipts[0].employee ? receipts[0].employee.name : 
             receipts[0].employeeName || 'Unknown'}
          </span>
        </p>
        {receipts[0].nozzles && receipts[0].nozzles.length > 0 && (
          <p className="flex justify-between mb-1">
            <span className="text-gray-600">Total Sales:</span>
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

export default MachineReceiptInfo;