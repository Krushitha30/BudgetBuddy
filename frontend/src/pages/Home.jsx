import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const Home = () => {
  return (
    <div className="auth-bg">
      <div className="home-hero">
        <div className="home-badge">✨ Personal Finance Made Simple</div>
        <h1 className="home-title">Take Control of Your <span className="gradient-text">Budget</span></h1>
        <p className="home-sub">Track expenses, manage budgets, and achieve your savings goals with BudgetBuddy — your all-in-one financial companion.</p>
        <div className="home-buttons">
          <Link to="/register" className="btn-primary">Get Started Free →</Link>
          <Link to="/login" className="btn-secondary">Sign In</Link>
        </div>
        <div className="home-stats">
          <div className="stat"><span className="stat-num">📊</span><span className="stat-label">Budget Tracking</span></div>
          <div className="stat"><span className="stat-num">💰</span><span className="stat-label">Expense Management</span></div>
          <div className="stat"><span className="stat-num">📈</span><span className="stat-label">Financial Reports</span></div>
        </div>
      </div>
    </div>
  );
};

export default Home;
