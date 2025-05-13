import mongoose from 'mongoose';

const NozzleDataSchema = new mongoose.Schema({
  nozzleNumber: {
    type: String,
    required: true
  },
  aValue: {
    type: String
  },
  vValue: {
    type: String
  },
  totalSales: {
    type: String
  }
});

const ReceiptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  machine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  },
  printDate: {
    type: String
  },
  pumpSerialNumber: {
    type: String
  },
  nozzles: [NozzleDataSchema],
  imagePath: {
    type: String
  },
  ocrText: {
    type: String
  },
  processed: {
    type: Boolean,
    default: true
  },
  processingErrors: {
    type: String
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  // New fields for employee information
  employeeName: {
    type: String
  },
  employeeId: {
    type: String
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  shiftTime: {
    type: String
  }
}, {
  timestamps: true
});

// Check if model already exists to prevent overwrite error
const Receipt = mongoose.models.Receipt || mongoose.model('Receipt', ReceiptSchema);

export default Receipt;