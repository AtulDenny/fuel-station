import axios from 'axios';

const API_URL = 'http://localhost:5000/api/receipts';

// Get token helper
const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Upload a receipt image for OCR processing
export const uploadReceipt = async (imageFile, options = {}) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Add optional parameters
    if (options.split !== undefined) {
      formData.append('split', options.split.toString());
    }
    
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading receipt:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error.response?.data?.message || 'Failed to upload receipt';
  }
};

// Get all receipts for the current user
export const getReceipts = async () => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(API_URL, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching receipts:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error.response?.data?.message || 'Failed to fetch receipts';
  }
};

// Get receipts by machine ID
export const getReceiptsByMachine = async (machineId) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(`${API_URL}/machine/${machineId}`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching receipts for machine ${machineId}:`, error);
    throw error.response?.data?.message || 'Failed to fetch receipts';
  }
};

// Get receipts by employee ID
export const getReceiptsByEmployee = async (employeeId) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(`${API_URL}/employee/${employeeId}`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching receipts for employee ${employeeId}:`, error);
    throw error.response?.data?.message || 'Failed to fetch receipts';
  }
};

// Get a specific receipt by ID
export const getReceiptById = async (id) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching receipt:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error.response?.data?.message || 'Failed to fetch receipt';
  }
};

// Delete a receipt
export const deleteReceipt = async (id) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error deleting receipt:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error.response?.data?.message || 'Failed to delete receipt';
  }
};