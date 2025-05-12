// server/routes/receipt.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import Receipt from '../models/Receipt.js';
import Machine from '../models/Machine.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('File upload only supports images: jpg, jpeg, png, gif'));
  }
});

// Middleware for authentication
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
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Helper function to find machine by pump serial number
const findMachineBySerial = async (serialNumber) => {
  if (!serialNumber) return null;
  
  try {
    // Try to find an exact match first
    let machine = await Machine.findOne({ machineId: serialNumber });
    
    // If no exact match, try a case-insensitive search
    if (!machine) {
      machine = await Machine.findOne({
        machineId: { $regex: new RegExp(serialNumber, 'i') }
      });
    }
    
    return machine;
  } catch (error) {
    console.error('Error finding machine by serial:', error);
    return null;
  }
};

// Upload and process receipt
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }
  
  try {
    // Prepare form data for OCR service
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path));
    formData.append('split', req.body.split || 'true');
    
    // Call OCR microservice
    const ocrResponse = await axios.post('http://localhost:5001/process', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    if (!ocrResponse.data.success) {
      return res.status(500).json({ 
        message: 'OCR processing failed', 
        error: ocrResponse.data.error 
      });
    }
    
    const results = ocrResponse.data.results;
    const receipts = [];
    
    // Process each receipt result
    for (const result of results) {
      const receiptData = result.data;
      
      // Try to find the machine by serial number
      const machine = await findMachineBySerial(receiptData['PUMP SERIAL NUMBER']);
      
      // Create receipt record
      const receipt = new Receipt({
        user: req.user.id,
        machine: machine ? machine._id : null,
        printDate: receiptData['PRINT DATE'],
        pumpSerialNumber: receiptData['PUMP SERIAL NUMBER'],
        nozzles: receiptData['NOZZLES'].map(nozzle => ({
          nozzleNumber: nozzle['NOZZLE'],
          aValue: nozzle['A'],
          vValue: nozzle['V'],
          totalSales: nozzle['TOT SALES']
        })),
        imagePath: req.file.path,
        ocrText: result.ocr_text,
        processed: true
      });
      
      await receipt.save();
      receipts.push(receipt);
    }
    
    res.status(201).json({
      message: 'Receipt(s) processed successfully',
      count: receipts.length,
      receipts: receipts
    });
    
  } catch (error) {
    console.error('Error processing receipt:', error);
    
    // Create receipt with error info
    try {
      await Receipt.create({
        user: req.user.id,
        imagePath: req.file.path,
        processed: false,
        processingErrors: error.message
      });
    } catch (saveError) {
      console.error('Error saving failed receipt:', saveError);
    }
    
    res.status(500).json({ 
      message: 'Error processing receipt', 
      error: error.message 
    });
  }
});

// Get all receipts for a user
router.get('/', auth, async (req, res) => {
  try {
    const receipts = await Receipt.find({ user: req.user.id })
      .populate('machine', 'name machineId location')
      .sort({ uploadDate: -1 });
    
    res.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ message: 'Server error while fetching receipts' });
  }
});

// Get a specific receipt by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('machine', 'name machineId location');
    
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    // Check if user owns the receipt
    if (receipt.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to access this receipt' });
    }
    
    res.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ message: 'Server error while fetching receipt' });
  }
});

// Delete a receipt
router.delete('/:id', auth, async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    // Check if user owns the receipt
    if (receipt.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this receipt' });
    }
    
    // Delete the image file if it exists
    if (receipt.imagePath && fs.existsSync(receipt.imagePath)) {
      fs.unlinkSync(receipt.imagePath);
    }
    
    await Receipt.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Receipt removed successfully' });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({ message: 'Server error while deleting receipt' });
  }
});

export default router;