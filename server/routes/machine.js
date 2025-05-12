// server/routes/machine.js
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

import express from 'express';
import jwt from 'jsonwebtoken';
import Machine from '../models/Machine.js';

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

// Get all machines
router.get('/', auth, async (req, res) => {
  try {
    const machines = await Machine.find().sort({ name: 1 });
    res.json(machines);
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get machine by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    res.json(machine);
  } catch (error) {
    console.error('Error fetching machine:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new machine
router.post('/', auth, async (req, res) => {
  try {
    const { name, machineId, location, fuelTypes, status, lastMaintenance, notes } = req.body;
    
    // Check if machine with same ID already exists
    const existingMachine = await Machine.findOne({ machineId });
    if (existingMachine) {
      return res.status(400).json({ message: 'Machine with this ID already exists' });
    }
    
    const newMachine = new Machine({
      name,
      machineId,
      location,
      fuelTypes,
      status,
      lastMaintenance,
      notes
    });
    
    const machine = await newMachine.save();
    res.status(201).json(machine);
  } catch (error) {
    console.error('Error creating machine:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a machine
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, machineId, location, fuelTypes, status, lastMaintenance, notes } = req.body;
    
    // Check if machine exists
    let machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    // Check if updating to a machineId that already exists on another machine
    if (machineId !== machine.machineId) {
      const existingMachine = await Machine.findOne({ machineId });
      if (existingMachine) {
        return res.status(400).json({ message: 'Machine with this ID already exists' });
      }
    }
    
    // Update fields
    machine.name = name || machine.name;
    machine.machineId = machineId || machine.machineId;
    machine.location = location || machine.location;
    machine.fuelTypes = fuelTypes || machine.fuelTypes;
    machine.status = status || machine.status;
    machine.lastMaintenance = lastMaintenance || machine.lastMaintenance;
    machine.notes = notes !== undefined ? notes : machine.notes;
    
    machine = await machine.save();
    res.json(machine);
  } catch (error) {
    console.error('Error updating machine:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a machine
router.delete('/:id', auth, async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    
    await Machine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Machine removed' });
  } catch (error) {
    console.error('Error deleting machine:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;