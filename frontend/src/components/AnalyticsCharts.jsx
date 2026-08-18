import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#94a3b8', font: { family: 'sans-serif', size: 12 } }
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      borderColor: '#334155',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      ticks: { color: '#94a3b8' },
      grid: { color: '#334155', drawBorder: false }
    },
    y: {
      ticks: { color: '#94a3b8' },
      grid: { color: '#334155', drawBorder: false }
    }
  }
};

const AnalyticsCharts = ({ monthlyTrend = {}, categoryExpenses = {}, financialSummary = {}, budgets = [], savingsGoals = [] }) => {
  // 1. Line Chart Data (Monthly Trend)
  const lineLabels = Object.keys(monthlyTrend);
  const lineValues = Object.values(monthlyTrend);

  const lineData = {
    labels: lineLabels.length > 0 ? lineLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Expenses (₹)',
        data: lineValues.length > 0 ? lineValues : [0, 0, 0, 0, 0, 0],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#60a5fa',
        pointRadius: 5
      }
    ]
  };

  // 2. Doughnut Chart Data (Category Expenses)
  const categoryLabels = Object.keys(categoryExpenses);
  const categoryValues = Object.values(categoryExpenses);

  const doughnutData = {
    labels: categoryLabels.length > 0 ? categoryLabels : ['Food', 'Shopping', 'Bills', 'Travel'],
    datasets: [
      {
        data: categoryValues.length > 0 ? categoryValues : [1, 1, 1, 1],
        backgroundColor: [
          '#ef4444', '#f59e0b', '#3b82f6', '#10b981',
          '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'
        ],
        borderWidth: 2,
        borderColor: '#1e1e2f'
      }
    ]
  };

  // 3. Bar Chart Data (Income vs Expense vs Savings)
  const barData = {
    labels: ['Financial Overview'],
    datasets: [
      {
        label: 'Income',
        data: [financialSummary.total_income || 0],
        backgroundColor: '#22c55e'
      },
      {
        label: 'Expenses',
        data: [financialSummary.total_expense || 0],
        backgroundColor: '#ef4444'
      },
      {
        label: 'Savings',
        data: [financialSummary.total_savings || 0],
        backgroundColor: '#8b5cf6'
      }
    ]
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
      
      {/* 📈 Chart 1: Monthly Expense Trend */}
      <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '16px', padding: '20px' }}>
        <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📈 Monthly Expense Trend
        </h3>
        <div style={{ height: '240px' }}>
          <Line data={lineData} options={chartOptions} />
        </div>
      </div>

      {/* 🍕 Chart 2: Category Breakdown */}
      <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '16px', padding: '20px' }}>
        <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🍕 Category Spending Breakdown
        </h3>
        <div style={{ height: '240px', display: 'flex', justifyContent: 'center' }}>
          <Doughnut
            data={doughnutData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: chartOptions.plugins
            }}
          />
        </div>
      </div>

      {/* 📊 Chart 3: Income vs Expenses Comparison */}
      <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '16px', padding: '20px' }}>
        <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 Income vs Expenses vs Savings
        </h3>
        <div style={{ height: '240px' }}>
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>

      {/* 🛡️ Chart 4: Budget Utilization Progress */}
      <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '16px', padding: '20px', gridColumn: '1 / -1' }}>
        <h3 style={{ color: '#fff', fontSize: '16px', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🛡️ Budget Utilization & Limits
        </h3>
        {budgets.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '14px' }}>No active budgets set up yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {budgets.map((b, idx) => {
              const util = b.budget_amount > 0 ? Math.round((b.spent_amount / b.budget_amount) * 100) : 0;
              let barColor = '#22c55e';
              if (util >= 100) barColor = '#ef4444';
              else if (util >= 90) barColor = '#f97316';
              else if (util >= 80) barColor = '#eab308';

              return (
                <div key={idx} style={{ background: '#252538', padding: '14px', borderRadius: '12px', borderLeft: `4px solid ${barColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
                    <span>{b.category}</span>
                    <span style={{ color: barColor }}>{util}%</span>
                  </div>
                  <div style={{ background: '#1e1e2f', borderRadius: '6px', height: '8px', width: '100%', overflow: 'hidden', margin: '10px 0' }}>
                    <div style={{ width: `${Math.min(util, 100)}%`, background: barColor, height: '100%', borderRadius: '6px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                    <span>Spent: {formatCurrency(b.spent_amount)}</span>
                    <span>Limit: {formatCurrency(b.budget_amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default AnalyticsCharts;
