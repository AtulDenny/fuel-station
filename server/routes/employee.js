// server/routes/employee.js
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

import express from 'express';
import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';

const router = express.Router();

// Middleware for authentication (reuse the auth middleware from server.js)
const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    req.user = decoded;
    next();
  } catch (error) { // Changed from err to error
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get all employees
router.get('/', auth, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employee by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new employee
router.post('/', auth, async (req, res) => {
  try {
    const { name, employeeId, position, contactNumber, email, status, joinDate } = req.body;
    
    // Check if employee with same ID already exists
    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this ID already exists' });
    }
    
    const newEmployee = new Employee({
      name,
      employeeId,
      position,
      contactNumber,
      email,
      status,
      joinDate
    });
    
    const employee = await newEmployee.save();
    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an employee
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, employeeId, position, contactNumber, email, status, joinDate } = req.body;
    
    // Check if employee exists
    let employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Check if updating to an employeeId that already exists on another employee
    if (employeeId !== employee.employeeId) {
      const existingEmployee = await Employee.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Employee with this ID already exists' });
      }
    }
    
    // Update fields
    employee.name = name || employee.name;
    employee.employeeId = employeeId || employee.employeeId;
    employee.position = position || employee.position;
    employee.contactNumber = contactNumber || employee.contactNumber;
    employee.email = email || employee.email;
    employee.status = status || employee.status;
    employee.joinDate = joinDate || employee.joinDate;
    
    employee = await employee.save();
    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an employee
router.delete('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee removed' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;