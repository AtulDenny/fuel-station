// server/routes/fuel.js
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */

import express from 'express';
import jwt from 'jsonwebtoken';
import Fuel from '../models/Fuel.js';
import Machine from '../models/Machine.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// Middleware for authentication (reuse the auth middleware)
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

// GET all fuel entries for a user
router.get('/', auth, async (req, res) => {
  try {
    const fuelEntries = await Fuel.find({ user: req.user.id })
      .populate('machine', 'name machineId location')
      .populate('employee', 'name employeeId position')
      .sort({ date: -1 });
    res.json(fuelEntries);
  } catch (error) {
    console.error('Error fetching fuel entries:', error);
    res.status(500).json({ message: 'Server error while fetching fuel data' });
  }
});

// GET fuel entries by machine
router.get('/machine/:machineId', auth, async (req, res) => {
  try {
    const { machineId } = req.params;
    const { period } = req.query;
    
    // Find the machine
    const machine = await Machine.findOne({ machineId });
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    // Date filter based on period
    const dateFilter = getDateFilter(period);
    
    // Get fuel entries for this machine with date filter
    const fuelEntries = await Fuel.find({ 
      user: req.user.id,
      machine: machine._id,
      ...(dateFilter && { date: dateFilter })
    })
    .sort({ date: -1 })
    .populate('employee', 'name employeeId position');
    
    res.json(fuelEntries);
  } catch (error) {
    console.error('Error fetching fuel by machine:', error);
    res.status(500).json({ message: 'Server error while fetching fuel data' });
  }
});

// GET fuel entries by employee
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { period } = req.query;
    
    // Find the employee
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Date filter based on period
    const dateFilter = getDateFilter(period);
    
    // Get fuel entries for this employee with date filter
    const fuelEntries = await Fuel.find({ 
      user: req.user.id,
      employee: employee._id,
      ...(dateFilter && { date: dateFilter })
    })
    .sort({ date: -1 })
    .populate('machine', 'name machineId location');
    
    res.json(fuelEntries);
  } catch (error) {
    console.error('Error fetching fuel by employee:', error);
    res.status(500).json({ message: 'Server error while fetching fuel data' });
  }
});

// GET fuel statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { period } = req.query;
    
    // Date filter based on period
    const dateFilter = getDateFilter(period);
    
    // Get all relevant fuel entries
    const fuelEntries = await Fuel.find({ 
      user: req.user.id,
      ...(dateFilter && { date: dateFilter })
    });
    
    // Calculate overall stats
    const totalQuantity = fuelEntries.reduce((sum, entry) => sum + entry.quantity, 0);
    const totalCost = fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.totalCost), 0);
    const avgPrice = totalQuantity > 0 ? (totalCost / totalQuantity) : 0;
    
    // Calculate stats by fuel type
    const fuelTypeStats = {};
    fuelEntries.forEach(entry => {
      if (!fuelTypeStats[entry.fuelType]) {
        fuelTypeStats[entry.fuelType] = {
          quantity: 0,
          cost: 0,
          count: 0
        };
      }
      
      fuelTypeStats[entry.fuelType].quantity += entry.quantity;
      fuelTypeStats[entry.fuelType].cost += parseFloat(entry.totalCost);
      fuelTypeStats[entry.fuelType].count += 1;
    });
    
    // Calculate stats by shift
    const shiftStats = {};
    fuelEntries.forEach(entry => {
      const shift = entry.shift || 'Morning';
      if (!shiftStats[shift]) {
        shiftStats[shift] = {
          quantity: 0,
          cost: 0,
          count: 0
        };
      }
      
      shiftStats[shift].quantity += entry.quantity;
      shiftStats[shift].cost += parseFloat(entry.totalCost);
      shiftStats[shift].count += 1;
    });
    
    // Get machine and employee counts
    const machineCount = await Machine.countDocuments();
    const employeeCount = await Employee.countDocuments();
    
    // Prepare result
    const stats = {
      overall: {
        totalQuantity,
        totalCost,
        avgPrice: avgPrice.toFixed(2),
        transactionCount: fuelEntries.length
      },
      fuelTypes: Object.entries(fuelTypeStats).map(([type, data]) => ({
        type,
        quantity: data.quantity.toFixed(2),
        cost: data.cost.toFixed(2),
        count: data.count,
        avgPrice: data.quantity > 0 ? (data.cost / data.quantity).toFixed(2) : '0'
      })),
      shifts: Object.entries(shiftStats).map(([shift, data]) => ({
        shift,
        quantity: data.quantity.toFixed(2),
        cost: data.cost.toFixed(2),
        count: data.count
      })),
      machineCount,
      employeeCount
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching fuel statistics:', error);
    res.status(500).json({ message: 'Server error while fetching fuel statistics' });
  }
});

// POST a new fuel entry
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received fuel entry request:', req.body);
    
    const { 
      fuelType, 
      quantity, 
      pricePerUnit, 
      odometerReading, 
      location, 
      notes, 
      date,
      machineId,
      employeeId,
      shift
    } = req.body;
    
    // Validate required fields
    if (!fuelType || !quantity || !pricePerUnit) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          fuelType: !fuelType ? 'Fuel type is required' : null,
          quantity: !quantity ? 'Quantity is required' : null,
          pricePerUnit: !pricePerUnit ? 'Price per unit is required' : null
        }
      });
    }
    
    // Parse numeric values
    const parsedQuantity = parseFloat(quantity);
    const parsedPrice = parseFloat(pricePerUnit);
    
    // Calculate total cost
    const totalCost = (parsedQuantity * parsedPrice).toFixed(2);
    
    // Create base fuel entry object
    const fuelEntryData = {
      user: req.user.id,
      fuelType,
      quantity: parsedQuantity,
      pricePerUnit: parsedPrice,
      totalCost: parseFloat(totalCost),
      odometerReading: odometerReading ? parseInt(odometerReading) : undefined,
      location,
      notes,
      date: date || Date.now(),
      shift: shift || 'Morning'
    };
    
    // Add machine if provided
    if (machineId) {
      // Try to find the machine by its ID
      const machine = await Machine.findOne({ machineId });
      if (machine) {
        fuelEntryData.machine = machine._id;
      }
    }
    
    // Add employee if provided
    if (employeeId) {
      // Try to find the employee by ID
      const employee = await Employee.findOne({ employeeId });
      if (employee) {
        fuelEntryData.employee = employee._id;
      }
    }

    console.log('Creating new fuel entry with:', fuelEntryData);

    const newFuelEntry = new Fuel(fuelEntryData);
    const fuelEntry = await newFuelEntry.save();
    
    // Populate the machine and employee fields for the response
    await fuelEntry.populate('machine', 'name machineId location');
    await fuelEntry.populate('employee', 'name employeeId position');
    
    console.log('Fuel entry saved successfully, ID:', fuelEntry._id);
    
    res.status(201).json(fuelEntry);
  } catch (error) {
    console.error('Error adding fuel entry:', error);
    res.status(500).json({ 
      message: 'Server error while adding fuel entry',
      error: error.message 
    });
  }
});

// DELETE a fuel entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const fuelEntry = await Fuel.findById(req.params.id);

    // Check if entry exists
    if (!fuelEntry) {
      return res.status(404).json({ message: 'Fuel entry not found' });
    }

    // Check if user owns the entry
    if (fuelEntry.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await Fuel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Fuel entry removed' });
  } catch (error) {
    console.error('Error deleting fuel entry:', error);
    res.status(500).json({ message: 'Server error while deleting fuel entry' });
  }
});

// Helper function for date filtering
function getDateFilter(period) {
  if (!period || period === 'all') {
    return null;
  }
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return { $gte: startOfDay };
    
    case 'week': {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      return { $gte: startOfWeek };
    }
    
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { $gte: startOfMonth };
    }
    
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { $gte: startOfYear };
    }
    
    default:
      return null;
  }
}

export default router;