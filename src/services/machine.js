// src/services/machine.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/machines';

// Get token helper
const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Get all machines
export const getMachines = async () => {
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
    console.error('Error fetching machines:', error);
    throw error.response?.data?.message || 'Failed to fetch machines';
  }
};

// Get machine by ID
export const getMachineById = async (id) => {
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
    console.error('Error fetching machine:', error);
    throw error.response?.data?.message || 'Failed to fetch machine';
  }
};

// Add a new machine
export const addMachine = async (machineData) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.post(API_URL, machineData, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error adding machine:', error);
    throw error.response?.data?.message || 'Failed to add machine';
  }
};

// Update a machine
export const updateMachine = async (id, machineData) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.put(`${API_URL}/${id}`, machineData, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating machine:', error);
    throw error.response?.data?.message || 'Failed to update machine';
  }
};

// Delete a machine
export const deleteMachine = async (id) => {
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
    console.error('Error deleting machine:', error);
    throw error.response?.data?.message || 'Failed to delete machine';
  }
};