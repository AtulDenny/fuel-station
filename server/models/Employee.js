// server/models/Employee.js
import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Terminated'],
    default: 'Active'
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Check if model already exists to prevent overwrite error
const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

export default Employee;