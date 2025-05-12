// src/components/ReceiptUploader.jsx
import { useState } from 'react';
import { uploadReceipt } from '../services/receipt';

const ReceiptUploader = ({ onReceiptProcessed }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [splitOption, setSplitOption] = useState(true);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }
    
    // Check if the file is an image
    if (!selectedFile.type.match('image.*')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      setFile(null);
      setPreview(null);
      return;
    }
    
    setFile(selectedFile);
    setError('');
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select an image file first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await uploadReceipt(file, { split: splitOption });
      
      // Call the callback with the processed receipt data
      if (onReceiptProcessed && typeof onReceiptProcessed === 'function') {
        onReceiptProcessed(result);
      }
      
      // Reset form
      setFile(null);
      setPreview(null);
      setSplitOption(true);
      
    } catch (err) {
      console.error('Error uploading receipt:', err);
      setError(err.message || 'Failed to process receipt');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Upload Receipt for Processing</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Receipt Image
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {!preview ? (
                <>
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </>
              ) : (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Receipt Preview"
                    className="mx-auto max-h-64 max-w-full rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center">
            <input
              id="split-option"
              name="split-option"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={splitOption}
              onChange={(e) => setSplitOption(e.target.checked)}
            />
            <label htmlFor="split-option" className="ml-2 block text-sm text-gray-900">
              Split into multiple receipts (if image contains multiple receipts)
            </label>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !file}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              loading || !file
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Processing...' : 'Process Receipt'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReceiptUploader;