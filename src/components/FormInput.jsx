// src/components/FormInput.jsx
import React from 'react';

const FormInput = ({ 
  label, 
  type, 
  id, 
  value, 
  onChange, 
  placeholder, 
  required = false,
  error,
  min,
  max,
  step,
  className
}) => {
  return (
    <div className={`mb-4 ${className || ''}`}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className={`w-full px-4 py-2 rounded-lg border ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
          'border-gray-300 focus:ring-blue-700 focus:border-blue-700'
        } transition duration-200 focus:outline-none focus:ring-2`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default FormInput;