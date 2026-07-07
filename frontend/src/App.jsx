import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/authService';

import Home     from './pages/Home';
import Login    from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses  from './pages/Expenses';
import Income    from './pages/Income';
import Budgets   from './pages/Budgets';
import Reports   from './pages/Reports';
import Settings  from './pages/Settings';

// Protect routes that need login
const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/expenses"  element={<PrivateRoute><Expenses /></PrivateRoute>} />
        <Route path="/income"    element={<PrivateRoute><Income /></PrivateRoute>} />
        <Route path="/budgets"   element={<PrivateRoute><Budgets /></PrivateRoute>} />
        <Route path="/reports"   element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><Settings /></PrivateRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
