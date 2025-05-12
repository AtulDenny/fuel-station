// src/components/FuelTable.jsx
import { useState } from 'react';
import { deleteFuelEntry } from '../services/fuel';

const FuelTable = ({ fuelEntries, setFuelEntries }) => {
  const [deleteLoading, setDeleteLoading] = useState(null);

  const handleDeleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        setDeleteLoading(id);
        await deleteFuelEntry(id);
        setFuelEntries(fuelEntries.filter(entry => entry._id !== id));
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry');
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate total cost
  const totalCost = fuelEntries.reduce((total, entry) => total + parseFloat(entry.totalCost), 0).toFixed(2);
  
  // Calculate total quantity
  const totalQuantity = fuelEntries.reduce((total, entry) => total + entry.quantity, 0).toFixed(2);

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fuel Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity (L)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price/Unit
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Cost
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Odometer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {fuelEntries.length > 0 ? (
            fuelEntries.map((entry) => (
              <tr key={entry._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(entry.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.fuelType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{entry.pricePerUnit.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₹{parseFloat(entry.totalCost).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.odometerReading || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.location || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeleteEntry(entry._id)}
                    disabled={deleteLoading === entry._id}
                    className="text-red-600 hover:text-red-900 mr-2 disabled:opacity-50"
                  >
                    {deleteLoading === entry._id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                No fuel entries found. Click the "Seed Data" button to add sample data.
              </td>
            </tr>
          )}
          
          {/* Summary row */}
          {fuelEntries.length > 0 && (
            <tr className="bg-gray-50 font-semibold">
              <td colSpan="2" className="px-6 py-4 text-right text-sm">
                Total:
              </td>
              <td className="px-6 py-4 text-sm">
                {totalQuantity} L
              </td>
              <td className="px-6 py-4 text-sm">
                -
              </td>
              <td className="px-6 py-4 text-sm font-medium">
                ₹{totalCost}
              </td>
              <td colSpan="3"></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FuelTable;