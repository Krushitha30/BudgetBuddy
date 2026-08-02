import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { getProfile } from '../services/authService';
import { getSummary } from '../services/incomeService';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, current_balance: 0 });

  useEffect(() => {
    getProfile().then(setUser).catch(() => {});
    getSummary().then(setSummary).catch(() => {});
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  const cards = [
    { icon: '💵', label: 'Total Income',    value: formatCurrency(summary.total_income),  color: '#22c55e' },
    { icon: '💸', label: 'Total Expenses',  value: formatCurrency(summary.total_expense),  color: '#ef4444' },
    { icon: '⚖️', label: 'Current Balance',  value: formatCurrency(summary.current_balance),  color: '#3b82f6' },
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
        <p>🚀 <strong>Personal Budget Summary</strong>: Track your income and expenses here. Use the side menu to log new entries.</p>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
