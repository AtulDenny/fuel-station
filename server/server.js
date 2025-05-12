// server/server.js
/* eslint-disable no-undef */  // Disable the no-undef rule for the entire file
/* eslint-disable no-unused-vars */  // Disable the no-unused-vars rule for the entire file

import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Import models
import Fuel from './models/Fuel.js';
import Machine from './models/Machine.js';
import Employee from './models/Employee.js';

// Import routes
import machineRoutes from './routes/machine.js';
import employeeRoutes from './routes/employee.js';
import fuelRoutes from './routes/fuel.js';  // Import the new fuel routes

// ES Module fixes for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/authapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Auth middleware
const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Routes
// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT token for immediate login after registration
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return token and user data for immediate login
    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected user route
app.get('/api/auth/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Seed initial data - machines, employees, and fuel entries
app.post('/api/seed-data', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if we already have data
    const existingMachines = await Machine.countDocuments();
    const existingEmployees = await Employee.countDocuments();
    const existingFuel = await Fuel.countDocuments({ user: userId });
    
    // Only seed if we don't have data yet
    if (existingMachines === 0 && existingEmployees === 0 && existingFuel === 0) {
      
      // 1. Create machines
      const machines = [
        {
          name: 'Pump Station 1',
          machineId: 'PS001',
          location: 'Main Entrance',
          fuelTypes: ['Petrol', 'Diesel'],
          status: 'Active',
          lastMaintenance: new Date('2025-04-01'),
          notes: 'High traffic location'
        },
        {
          name: 'Pump Station 2',
          machineId: 'PS002',
          location: 'North Side',
          fuelTypes: ['Petrol', 'CNG'],
          status: 'Active',
          lastMaintenance: new Date('2025-04-15'),
          notes: 'CNG specialist pump'
        },
        {
          name: 'Pump Station 3',
          machineId: 'PS003',
          location: 'South Side',
          fuelTypes: ['Petrol', 'Diesel', 'CNG'],
          status: 'Maintenance',
          lastMaintenance: new Date('2025-05-02'),
          notes: 'Currently under maintenance'
        }
      ];
      
      const createdMachines = await Machine.insertMany(machines);
      console.log('Machines created:', createdMachines.length);
      
      // 2. Create employees
      const employees = [
        {
          name: 'Rahul Sharma',
          employeeId: 'EMP001',
          position: 'Pump Operator',
          contactNumber: '9876543210',
          email: 'rahul@example.com',
          status: 'Active',
          joinDate: new Date('2024-01-15')
        },
        {
          name: 'Priya Patel',
          employeeId: 'EMP002',
          position: 'Cashier',
          contactNumber: '9876543211',
          email: 'priya@example.com',
          status: 'Active',
          joinDate: new Date('2024-02-10')
        },
        {
          name: 'Amit Kumar',
          employeeId: 'EMP003',
          position: 'Pump Operator',
          contactNumber: '9876543212',
          email: 'amit@example.com',
          status: 'On Leave',
          joinDate: new Date('2023-11-05')
        }
      ];
      
      const createdEmployees = await Employee.insertMany(employees);
      console.log('Employees created:', createdEmployees.length);
      
      // 3. Create fuel entries
      const fuelEntries = [
        {
          user: userId,
          machine: createdMachines[0]._id,
          employee: createdEmployees[0]._id,
          date: new Date('2025-05-01'),
          fuelType: 'Petrol',
          quantity: 35.5,
          pricePerUnit: 92.34,
          totalCost: (35.5 * 92.34).toFixed(2),
          odometerReading: 12500,
          location: 'Main Entrance',
          shift: 'Morning'
        },
        {
          user: userId,
          machine: createdMachines[1]._id,
          employee: createdEmployees[1]._id,
          date: new Date('2025-04-15'),
          fuelType: 'Petrol',
          quantity: 40.2,
          pricePerUnit: 91.75,
          totalCost: (40.2 * 91.75).toFixed(2),
          odometerReading: 12200,
          location: 'North Side',
          shift: 'Afternoon'
        },
        {
          user: userId,
          machine: createdMachines[0]._id,
          employee: createdEmployees[2]._id,
          date: new Date('2025-04-02'),
          fuelType: 'Diesel',
          quantity: 30.8,
          pricePerUnit: 93.10,
          totalCost: (30.8 * 93.10).toFixed(2),
          odometerReading: 11950,
          location: 'Main Entrance',
          shift: 'Evening'
        }
      ];
      
      const createdFuelEntries = await Fuel.insertMany(fuelEntries);
      console.log('Fuel entries created:', createdFuelEntries.length);
      
      res.json({ 
        message: 'Data seeded successfully',
        machines: createdMachines.length,
        employees: createdEmployees.length,
        fuelEntries: createdFuelEntries.length
      });
    } else {
      res.json({ message: 'Data already exists, skipping seed operation' });
    }
  } catch (error) {
    console.error('Error seeding data:', error);
    res.status(500).json({ message: 'Server error while seeding data' });
  }
});

// Use the route files
app.use('/api/machines', machineRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/fuel', fuelRoutes);  // Use the fuel routes

// Serve static files for production
if (process.env.NODE_ENV === 'production') {
  // Serve the static files from the Vite build output directory
  app.use(express.static(path.resolve(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});