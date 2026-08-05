import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import {
  getMonthlyFinancialReport,
  getExpenseReport,
  getSavingsReport,
  getFullFinancialSummary,
  downloadReportCSV
} from '../services/reportService';
import './Dashboard.css';

const Reports = () => {
  const [filterType, setFilterType] = useState('current_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [loading, setLoading] = useState(true);
  const [summaryReport, setSummaryReport] = useState(null);
  const [expenseReport, setExpenseReport] = useState(null);
  const [savingsReport, setSavingsReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType === 'custom' && startDate && endDate) {
        params.filter_type = 'custom';
        params.start_date = startDate;
        params.end_date = endDate;
      } else if (filterType === 'previous_month') {
        params.filter_type = 'previous_month';
      } else {
        params.filter_type = 'current_month';
      }

      const [summaryRes, expenseRes, savingsRes] = await Promise.all([
        getFullFinancialSummary(params),
        getExpenseReport(params),
        getSavingsReport(params)
      ]);

      setSummaryReport(summaryRes);
      setExpenseReport(expenseRes);
      setSavingsReport(savingsRes);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterType, startDate, endDate]);

  const handleExportCSV = async (type = 'summary') => {
    const params = {};
    if (filterType === 'custom' && startDate && endDate) {
      params.filter_type = 'custom';
      params.start_date = startDate;
      params.end_date = endDate;
    } else if (filterType === 'previous_month') {
      params.filter_type = 'previous_month';
    }
    await downloadReportCSV(type, params);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const fin = summaryReport?.financial_summary || {};

  return (
    <MainLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>📈 Financial Reports</h1>
          <p className="page-sub" style={{ margin: '4px 0 0 0' }}>Generate, inspect, and export detailed monthly & category reports.</p>
        </div>

        {/* Export Button */}
        <button
          onClick={() => handleExportCSV('summary')}
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📥 Export CSV Report
        </button>
      </div>

      {/* Date Filter Bar */}
      <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '16px 20px', marginBottom: '28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', justifyContent: 'space-between' }}>
        
        {/* Preset Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'current_month', label: '📅 Current Month' },
            { id: 'previous_month', label: '⏪ Previous Month' },
            { id: 'custom', label: '⚙️ Custom Range' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              style={{
                background: filterType === btn.id ? '#3b82f6' : '#252538',
                color: filterType === btn.id ? '#fff' : '#94a3b8',
                border: filterType === btn.id ? '1px solid #60a5fa' : '1px solid #334155',
                borderRadius: '8px',
                padding: '8px 14px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs */}
        {filterType === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ background: '#252538', border: '1px solid #334155', color: '#fff', padding: '7px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
            <span style={{ color: '#94a3b8' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ background: '#252538', border: '1px solid #334155', color: '#fff', padding: '7px 12px', borderRadius: '8px', fontSize: '13px' }}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>Loading financial reports...</div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {[
              { icon: '💵', label: 'Total Income',     value: formatCurrency(fin.total_income),     color: '#22c55e' },
              { icon: '💸', label: 'Total Expenses',   value: formatCurrency(fin.total_expense),    color: '#ef4444' },
              { icon: '⚖️', label: 'Current Balance',  value: formatCurrency(fin.current_balance),  color: '#3b82f6' },
              { icon: '🎯', label: 'Total Savings',    value: formatCurrency(fin.total_savings),    color: '#a78bfa' },
              { icon: '📊', label: 'Remaining Budget', value: formatCurrency(fin.remaining_budget), color: '#f59e0b' },
            ].map((card, i) => (
              <div key={i} style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{card.icon}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>{card.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: card.color, marginTop: '4px' }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #2a2a40', marginBottom: '24px', gap: '20px' }}>
            {[
              { id: 'overview', label: '📊 Financial Summary' },
              { id: 'expenses', label: '💸 Expense Report' },
              { id: 'savings',  label: '🎯 Savings Report' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === tab.id ? '#60a5fa' : '#94a3b8',
                  padding: '10px 4px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Financial Summary Overview */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              {/* Category Breakdown */}
              <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '16px' }}>🏷️ Category Expense Breakdown</h3>
                {Object.keys(summaryReport?.expense_summary?.category_breakdown || {}).length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '13px' }}>No expense records found for this period.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(summaryReport.expense_summary.category_breakdown).map(([cat, amt]) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', background: '#252538', padding: '10px 14px', borderRadius: '8px' }}>
                        <span style={{ color: '#fff', fontWeight: '600' }}>{cat}</span>
                        <span style={{ color: '#ef4444', fontWeight: '700' }}>{formatCurrency(amt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Income Breakdown */}
              <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '16px' }}>💵 Income Source Breakdown</h3>
                {Object.keys(summaryReport?.income_summary?.source_breakdown || {}).length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '13px' }}>No income records found for this period.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(summaryReport.income_summary.source_breakdown).map(([src, amt]) => (
                      <div key={src} style={{ display: 'flex', justifyContent: 'space-between', background: '#252538', padding: '10px 14px', borderRadius: '8px' }}>
                        <span style={{ color: '#fff', fontWeight: '600' }}>{src}</span>
                        <span style={{ color: '#22c55e', fontWeight: '700' }}>{formatCurrency(amt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget Summary */}
              <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '20px', gridColumn: '1 / -1' }}>
                <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '16px' }}>📊 Budget Utilization Summary</h3>
                {(summaryReport?.budget_summary?.budgets || []).length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '13px' }}>No active budgets configured for this period.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    {summaryReport.budget_summary.budgets.map((b, idx) => (
                      <div key={idx} style={{ background: '#252538', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px' }}>{b.category}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>Budget: {formatCurrency(b.budget_amount)}</div>
                        <div style={{ color: '#ef4444', fontSize: '12px' }}>Spent: {formatCurrency(b.spent_amount)}</div>
                        <div style={{ color: '#22c55e', fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>Remaining: {formatCurrency(b.remaining_amount)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Expense Report */}
          {activeTab === 'expenses' && (
            <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#fff', fontSize: '16px', margin: 0 }}>💸 Expense Report Records</h3>
                <button
                  onClick={() => handleExportCSV('expenses')}
                  style={{ background: '#252538', color: '#60a5fa', border: '1px solid #3b82f6', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}
                >
                  📥 Export Expenses CSV
                </button>
              </div>

              {(expenseReport?.expenses || []).length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>No expenses found in this date range.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#252538', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                        <th style={{ padding: '12px 16px' }}>Title</th>
                        <th style={{ padding: '12px 16px' }}>Category</th>
                        <th style={{ padding: '12px 16px' }}>Amount</th>
                        <th style={{ padding: '12px 16px' }}>Date</th>
                        <th style={{ padding: '12px 16px' }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseReport.expenses.map((exp, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #2a2a40' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '600' }}>{exp.title}</td>
                          <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{exp.category}</td>
                          <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: 'bold' }}>{formatCurrency(exp.amount)}</td>
                          <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{exp.date}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{exp.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Savings Goals Report */}
          {activeTab === 'savings' && (
            <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#fff', fontSize: '16px', margin: 0 }}>🎯 Savings Goals Report</h3>
                <button
                  onClick={() => handleExportCSV('savings')}
                  style={{ background: '#252538', color: '#a78bfa', border: '1px solid #8b5cf6', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}
                >
                  📥 Export Savings CSV
                </button>
              </div>

              {(savingsReport?.savings_reports || []).length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>No savings goals created yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {savingsReport.savings_reports.map((goal, idx) => (
                    <div key={idx} style={{ background: '#252538', border: '1px solid #334155', borderRadius: '12px', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>{goal.goal_name}</h4>
                        <span style={{
                          background: goal.status === 'COMPLETED' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                          color: goal.status === 'COMPLETED' ? '#22c55e' : '#60a5fa',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          borderRadius: '6px'
                        }}>
                          {goal.status}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ background: '#1e1e2f', borderRadius: '6px', height: '8px', width: '100%', overflow: 'hidden', marginBottom: '12px' }}>
                        <div style={{ width: `${Math.min(goal.progress_percentage, 100)}%`, background: '#22c55e', height: '100%', borderRadius: '6px' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8' }}>
                        <span>Target: <strong style={{ color: '#fff' }}>{formatCurrency(goal.target_amount)}</strong></span>
                        <span>Saved: <strong style={{ color: '#22c55e' }}>{formatCurrency(goal.saved_amount)}</strong></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
                        <span>Remaining: <strong style={{ color: '#ef4444' }}>{formatCurrency(goal.remaining_amount)}</strong></span>
                        <span>Progress: <strong style={{ color: '#a78bfa' }}>{goal.progress_percentage}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </>
      )}
    </MainLayout>
  );
};

export default Reports;
