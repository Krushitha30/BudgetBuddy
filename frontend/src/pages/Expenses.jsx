import React from 'react';
import MainLayout from '../layouts/MainLayout';
import './Dashboard.css';
const Expenses = () => (
  <MainLayout>
    <div className="page-header"><h1>💸 Expenses</h1><p className="page-sub">Track your spending</p></div>
    <div className="placeholder-page"><span>💸</span><h2>Expenses Coming Soon</h2><p>Expense tracking will be added in the next milestone.</p></div>
  </MainLayout>
);
export default Expenses;
