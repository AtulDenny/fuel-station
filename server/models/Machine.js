// server/models/Machine.js
import mongoose from 'mongoose';

const MachineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  machineId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  fuelTypes: [{
    type: String,
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric']
  }],
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Inactive'],
    default: 'Active'
  },
  lastMaintenance: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Check if model already exists to prevent overwrite error
const Machine = mongoose.models.Machine || mongoose.model('Machine', MachineSchema);

export default Machine;