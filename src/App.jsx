// src/App.jsx
import React from 'react';
import LoginForm from './components/LoginForm';
import RegisterPage from './components/RegisterPage';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm />
        <RegisterPage />
      </div>
    </div>
  );
}

export default App;