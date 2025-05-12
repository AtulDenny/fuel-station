// src/components/ReceiptsList.jsx
import { useState, useEffect } from 'react';
import { getReceipts, deleteReceipt } from '../services/receipt';
import { format } from 'date-fns';

const ReceiptsList = ({ onRefreshNeeded }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // Load receipts
  useEffect(() => {
    const loadReceipts = async () => {
      setLoading(true);
      try {
        const data = await getReceipts();
        setReceipts(data);
        setError('');
      } catch (err) {
        console.error('Error loading receipts:', err);
        setError('Failed to load receipts. ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadReceipts();
  }, [onRefreshNeeded]);
  
  // Handle receipt deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this receipt?')) return;
    
    setDeleteLoading(id);
    try {
      await deleteReceipt(id);
      setReceipts(receipts.filter(receipt => receipt._id !== id));
    } catch (err) {
      console.error('Error deleting receipt:', err);
      setError('Failed to delete receipt. ' + err.message);
    } finally {
      setDeleteLoading(null);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString || 'N/A';
    }
  };
  
  // Handle view details
  const handleViewDetails = (receipt) => {
    setSelectedReceipt(receipt === selectedReceipt ? null : receipt);
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Receipts</h3>
        <div className="text-center py-4">
          <p className="text-gray-600">Loading receipts...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Receipts</h3>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }
  
  if (receipts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Receipts</h3>
        <div className="text-center py-4">
          <p className="text-gray-600">No receipts found. Upload a receipt to get started.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Receipts</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pump / Serial
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nozzles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {receipts.map((receipt) => (
              <tr key={receipt._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(receipt.uploadDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {receipt.machine 
                    ? `${receipt.machine.name} (${receipt.machine.machineId})` 
                    : receipt.pumpSerialNumber || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {receipt.nozzles && receipt.nozzles.length > 0 
                    ? receipt.nozzles.map(n => n.nozzleNumber).join(', ')
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {receipt.processed ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Processed
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Failed
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleViewDetails(receipt)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    {selectedReceipt === receipt ? 'Hide Details' : 'View Details'}
                  </button>
                  <button
                    onClick={() => handleDelete(receipt._id)}
                    disabled={deleteLoading === receipt._id}
                    className="text-red-600 hover:text-red-900"
                  >
                    {deleteLoading === receipt._id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Receipt Detail View */}
      {selectedReceipt && (
        <div className="mt-6 border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold text-lg mb-2">Receipt Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pump Serial Number:</p>
              <p className="font-medium">{selectedReceipt.pumpSerialNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Print Date:</p>
              <p className="font-medium">{selectedReceipt.printDate || 'N/A'}</p>
            </div>
          </div>
          
          {selectedReceipt.nozzles && selectedReceipt.nozzles.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Nozzles Data:</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nozzle</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">A Value</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">V Value</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedReceipt.nozzles.map((nozzle, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {nozzle.nozzleNumber}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {nozzle.aValue || 'N/A'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {nozzle.vValue || 'N/A'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {nozzle.totalSales || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">OCR Output:</p>
            <div className="bg-white p-3 rounded border border-gray-200 text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
              {selectedReceipt.ocrText || 'No OCR text available'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptsList;