// src/components/ReceiptsTab.jsx
import { useState } from 'react';
import ReceiptUploader from './ReceiptUploader';
import ReceiptsList from './ReceiptsList';

const ReceiptsTab = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [processingSuccess, setProcessingSuccess] = useState(null);
  
  const handleReceiptProcessed = (result) => {
    // Set success message
    setProcessingSuccess({
      count: result.receipts.length,
      message: `Successfully processed ${result.receipts.length} receipt(s)`
    });
    
    // Trigger a refresh of the receipts list
    setRefreshTrigger(prev => prev + 1);
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setProcessingSuccess(null);
    }, 5000);
  };
  
  return (
    <div>
      {processingSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
          <span>{processingSuccess.message}</span>
          <button
            onClick={() => setProcessingSuccess(null)}
            className="text-green-700 font-bold"
          >
            ×
          </button>
        </div>
      )}
      
      <ReceiptUploader onReceiptProcessed={handleReceiptProcessed} />
      <ReceiptsList onRefreshNeeded={refreshTrigger} />
    </div>
  );
};

export default ReceiptsTab;