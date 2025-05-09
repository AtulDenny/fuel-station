// server/config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootPath = path.resolve(__dirname, '../../');

// Load environment variables from root directory
dotenv.config({ path: path.join(rootPath, '.env') });

// Fallback MongoDB URI if environment variable isn't loaded
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/loginapp';

const connectDB = async () => {
  try {
    // Log the connection string (remove in production)
    console.log('Attempting to connect to MongoDB with URI:', MONGODB_URI);
    
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;