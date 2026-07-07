import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../services/authService';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">💰 BudgetBuddy</div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>🏠 Dashboard</NavLink>
          <NavLink to="/expenses"  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>💸 Expenses</NavLink>
          <NavLink to="/income"    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>💵 Income</NavLink>
          <NavLink to="/budgets"   className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📊 Budgets</NavLink>
          <NavLink to="/reports"   className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>📈 Reports</NavLink>
          <NavLink to="/settings"  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>⚙️ Settings</NavLink>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default MainLayout;
