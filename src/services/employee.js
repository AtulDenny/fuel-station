// src/services/employee.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/employees';

// Get token helper
const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Get all employees
export const getEmployees = async () => {
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
    console.error('Error fetching employees:', error);
    throw error.response?.data?.message || 'Failed to fetch employees';
  }
};

// Get employee by ID
export const getEmployeeById = async (id) => {
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
    console.error('Error fetching employee:', error);
    throw error.response?.data?.message || 'Failed to fetch employee';
  }
};

// Add a new employee
export const addEmployee = async (employeeData) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.post(API_URL, employeeData, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error.response?.data?.message || 'Failed to add employee';
  }
};

// Update an employee
export const updateEmployee = async (id, employeeData) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.put(`${API_URL}/${id}`, employeeData, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error.response?.data?.message || 'Failed to update employee';
  }
};

// Delete an employee
export const deleteEmployee = async (id) => {
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
    console.error('Error deleting employee:', error);
    throw error.response?.data?.message || 'Failed to delete employee';
  }
}
