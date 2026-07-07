import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { getProfile } from '../services/authService';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getProfile().then(setUser).catch(() => {});
  }, []);

  const cards = [
    { icon: '💸', label: 'Total Expenses',  value: '₹0.00',  color: '#ef4444' },
    { icon: '💵', label: 'Total Income',    value: '₹0.00',  color: '#22c55e' },
    { icon: '📊', label: 'Active Budgets',  value: '0',      color: '#7c3aed' },
    { icon: '🎯', label: 'Savings Goals',   value: '0',      color: '#f59e0b' },
  ];

  return (
    <MainLayout>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-sub">Welcome back{user ? `, ${user.username}` : ''}! 👋</p>
      </div>
      <div className="stats-grid">
        {cards.map((c, i) => (
          <div className="stat-card" key={i} style={{ '--accent': c.color }}>
            <div className="card-icon">{c.icon}</div>
            <div className="card-info">
              <span className="card-label">{c.label}</span>
              <span className="card-value">{c.value}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-note">
        <p>🚀 <strong>Milestone 1 Complete!</strong> Authentication is working. Start adding your expenses and budgets to see insights here.</p>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
