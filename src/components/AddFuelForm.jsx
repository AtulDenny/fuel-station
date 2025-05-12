// src/components/AddFuelForm.jsx
import { useState } from 'react';
import { addFuelEntry } from '../services/fuel';
import FormInput from './FormInput';

const AddFuelForm = ({ onFuelAdded }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fuelType: 'Petrol',
    quantity: '',
    pricePerUnit: '',
    odometerReading: '',
    location: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const calculateTotalCost = () => {
    if (formData.quantity && formData.pricePerUnit) {
      return (parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit)).toFixed(2);
    }
    return '0.00';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.date || !formData.fuelType || !formData.quantity || !formData.pricePerUnit) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare data for submission
      const fuelData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        totalCost: parseFloat(calculateTotalCost()),
        odometerReading: formData.odometerReading ? parseInt(formData.odometerReading) : undefined
      };

      console.log('Submitting fuel data:', fuelData);

      // Add fuel entry
      const newEntry = await addFuelEntry(fuelData);
      console.log('Response from server:', newEntry);
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        fuelType: 'Petrol',
        quantity: '',
        pricePerUnit: '',
        odometerReading: '',
        location: ''
      });
      
      // Close form
      setIsFormOpen(false);
      
      // Notify parent component
      if (onFuelAdded && typeof onFuelAdded === 'function') {
        onFuelAdded(newEntry);
      }
      
    } catch (err) {
      console.error('Error adding fuel entry:', err);
      setError(err.message || 'Failed to add fuel entry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      {!isFormOpen ? (
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
        >
          Add New Fuel Entry
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add New Fuel Entry</h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Date"
                type="date"
                id="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
              
              <div className="mb-4">
                <label 
                  htmlFor="fuelType" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fuel Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="fuelType"
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-700 focus:border-blue-700 transition duration-200 focus:outline-none focus:ring-2"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>
              
              <FormInput
                label="Quantity (L)"
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g. 35.5"
                step="0.01"
                min="0"
                required
              />
              
              <FormInput
                label="Price per Unit (₹)"
                type="number"
                id="pricePerUnit"
                name="pricePerUnit"
                value={formData.pricePerUnit}
                onChange={handleChange}
                placeholder="e.g. 92.50"
                step="0.01"
                min="0"
                required
              />
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Cost (₹)
                </label>
                <div className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
                  ₹{calculateTotalCost()}
                </div>
              </div>
              
              <FormInput
                label="Odometer Reading (km)"
                type="number"
                id="odometerReading"
                name="odometerReading"
                value={formData.odometerReading}
                onChange={handleChange}
                placeholder="e.g. 12500"
                min="0"
              />
              
              <FormInput
                label="Location"
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Shell, MG Road"
                className="col-span-2"
              />
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="mr-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-70"
              >
                {isLoading ? 'Adding...' : 'Add Entry'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddFuelForm;