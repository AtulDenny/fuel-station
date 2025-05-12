// src/services/fuel.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/fuel';

// Get token helper
const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Get all fuel entries
export const getFuelEntries = async () => {
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
    console.error('Error in getFuelEntries:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error.response?.data?.message || 'Failed to fetch fuel entries';
  }
};

// Get fuel entries by machine
export const getFuelByMachine = async (machineId, period = 'all') => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(`${API_URL}/machine/${machineId}`, {
      params: { period },
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error in getFuelByMachine for ${machineId}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error.response?.data?.message || `Failed to fetch fuel data for machine ${machineId}`;
  }
};

// Get fuel entries by employee
export const getFuelByEmployee = async (employeeId, period = 'all') => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(`${API_URL}/employee/${employeeId}`, {
      params: { period },
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error in getFuelByEmployee for ${employeeId}:`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error.response?.data?.message || `Failed to fetch fuel data for employee ${employeeId}`;
  }
};

// Get fuel statistics
export const getFuelStats = async (period = 'all') => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(`${API_URL}/stats`, {
      params: { period },
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error in getFuelStats:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error.response?.data?.message || 'Failed to fetch fuel statistics';
  }
};

// Add a new fuel entry with machine and employee
export const addFuelEntry = async (fuelData) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    console.log('Adding fuel entry:', fuelData);
    
    const response = await axios.post(API_URL, fuelData, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Add fuel entry response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in addFuelEntry:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error.response?.data?.message || 'Failed to add fuel entry';
  }
};

// Delete a fuel entry
export const deleteFuelEntry = async (entryId) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    console.log('Deleting fuel entry:', entryId);
    
    const response = await axios.delete(`${API_URL}/${entryId}`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    console.log('Delete fuel entry response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in deleteFuelEntry:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error.response?.data?.message || 'Failed to delete fuel entry';
  }
};

// Seed all data - machines, employees, and fuel entries
export const seedAllData = async () => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    console.log('Seeding all data...');
    
    const response = await axios.post('http://localhost:5000/api/seed-data', {}, {
      headers: {
        'x-auth-token': token
      }
    });
    
    console.log('Seed data response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in seedAllData:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error.response?.data?.message || 'Failed to seed data';
  }
};