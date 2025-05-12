// server/models/Fuel.js
import mongoose from 'mongoose';

const FuelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  fuelType: {
    type: String,
    required: true,
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric']
  },
  quantity: {
    type: Number,
    required: true
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  odometerReading: {
    type: Number
  },
  location: {
    type: String
  },
  notes: {
    type: String
  },
  shift: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Night'],
    default: 'Morning'
  }
}, {
  timestamps: true
});

// Create a virtual for total cost calculation
FuelSchema.pre('save', function(next) {
  if (this.quantity && this.pricePerUnit) {
    this.totalCost = parseFloat((this.quantity * this.pricePerUnit).toFixed(2));
  }
  next();
});

// Check if model already exists to prevent overwrite error
const Fuel = mongoose.models.Fuel || mongoose.model('Fuel', FuelSchema);

export default Fuel;