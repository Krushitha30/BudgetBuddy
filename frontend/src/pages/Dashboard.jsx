import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { getProfile } from '../services/authService';
import { getDashboardData } from '../services/analyticsService';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile().then(setUser).catch(() => {});
    getDashboardData()
      .then((data) => setDashboard(data))
      .catch((err) => console.error("Error loading dashboard data", err))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const summary = dashboard?.financial_summary || {};
  const stats = dashboard?.highest_lowest_expenses || {};
  const categoryData = dashboard?.category_analysis?.by_category || {};
  const monthlyData = dashboard?.monthly_trend?.monthly_trend || {};
  const recentExpenses = dashboard?.recent_transactions?.expenses || [];
  const activeSavings = dashboard?.active_savings_goals || [];

  const cards = [
    { icon: '💵', label: 'Total Income',     value: formatCurrency(summary.total_income),     color: '#22c55e' },
    { icon: '💸', label: 'Total Expenses',   value: formatCurrency(summary.total_expense),    color: '#ef4444' },
    { icon: '⚖️', label: 'Current Balance',  value: formatCurrency(summary.current_balance),  color: '#3b82f6' },
    { icon: '🎯', label: 'Total Savings',    value: formatCurrency(summary.total_savings),    color: '#a78bfa' },
    { icon: '📊', label: 'Remaining Budget', value: formatCurrency(summary.remaining_budget), color: '#f59e0b' },
  ];

  return (
    <MainLayout>
      <div className="page-header">
        <h1>📊 Dashboard & Analytics</h1>
        <p className="page-sub">Welcome back{user ? `, ${user.username}` : ''}! Here is your complete financial overview.</p>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>Loading dashboard analytics...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {cards.map((c, i) => (
              <div className="stat-card" key={i} style={{ '--accent': c.color, background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '12px', padding: '18px' }}>
                <div className="card-icon" style={{ fontSize: '24px', marginBottom: '8px' }}>{c.icon}</div>
                <div className="card-info">
                  <span className="card-label" style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>{c.label}</span>
                  <span className="card-value" style={{ fontSize: '20px', fontWeight: 'bold', color: c.color }}>{c.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Category & Monthly Analytics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            
            {/* Category Breakdown */}
            <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '16px' }}>🏷️ Expense by Category</h3>
              {Object.keys(categoryData).length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>No expense records available.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(categoryData).map(([cat, amt]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#252538', padding: '10px 14px', borderRadius: '8px' }}>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{cat}</span>
                      <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '14px' }}>{formatCurrency(amt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Trend */}
            <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '16px' }}>📅 Monthly Spending Trend</h3>
              {Object.keys(monthlyData).length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>No monthly data available.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(monthlyData).map(([month, amt]) => (
                    <div key={month} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#252538', padding: '10px 14px', borderRadius: '8px' }}>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{month}</span>
                      <span style={{ color: '#4da6ff', fontWeight: '700', fontSize: '14px' }}>{formatCurrency(amt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Expense Highlights (Highest, Lowest, Latest, Oldest) */}
          <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
            <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '16px' }}>🔥 Expense Highlights</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              
              <div style={{ background: '#252538', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Highest Expense</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444', marginTop: '4px' }}>
                  {stats.highest_expense ? `${stats.highest_expense.title} (${formatCurrency(stats.highest_expense.amount)})` : 'None'}
                </div>
              </div>

              <div style={{ background: '#252538', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #22c55e' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Lowest Expense</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e', marginTop: '4px' }}>
                  {stats.lowest_expense ? `${stats.lowest_expense.title} (${formatCurrency(stats.lowest_expense.amount)})` : 'None'}
                </div>
              </div>

              <div style={{ background: '#252538', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Latest Expense</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6', marginTop: '4px' }}>
                  {stats.latest_expense ? `${stats.latest_expense.title} (${formatCurrency(stats.latest_expense.amount)})` : 'None'}
                </div>
              </div>

              <div style={{ background: '#252538', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #a78bfa' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Oldest Expense</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#a78bfa', marginTop: '4px' }}>
                  {stats.oldest_expense ? `${stats.oldest_expense.title} (${formatCurrency(stats.oldest_expense.amount)})` : 'None'}
                </div>
              </div>

            </div>
          </div>

          {/* Active Savings & Recent Transactions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Active Savings Goals */}
            <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '16px' }}>🎯 Active Savings Goals</h3>
              {activeSavings.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>No active savings goals.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeSavings.map((goal) => (
                    <div key={goal.id} style={{ background: '#252538', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{goal.goal_name}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>Target: {formatCurrency(goal.target_amount)}</div>
                      </div>
                      <div style={{ color: '#22c55e', fontWeight: '700', fontSize: '14px' }}>
                        Saved: {formatCurrency(goal.saved_amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Expenses */}
            <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '16px' }}>💸 Recent Expenses</h3>
              {recentExpenses.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>No recent expenses.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentExpenses.map((exp) => (
                    <div key={exp.id} style={{ background: '#252538', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{exp.title}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>{exp.category} • {exp.expense_date}</div>
                      </div>
                      <div style={{ color: '#ef4444', fontWeight: '700', fontSize: '14px' }}>
                        -{formatCurrency(exp.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </MainLayout>
  );
};

export default Dashboard;
