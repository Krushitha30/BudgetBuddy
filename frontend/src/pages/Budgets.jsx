import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { getBudgets, createBudget, updateBudget, deleteBudget, getBudgetSummary } from '../services/budgetService';
import './Dashboard.css';

const CATEGORIES = [
  'FOOD',
  'TRAVEL',
  'SHOPPING',
  'EDUCATION',
  'ENTERTAINMENT',
  'HEALTHCARE',
  'BILLS',
  'MISCELLANEOUS'
];

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  
  // Summary monitoring states
  const [summaryCategory, setSummaryCategory] = useState('FOOD');
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    category: 'FOOD',
    budget_amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const loadBudgets = async () => {
    try {
      const data = await getBudgets();
      setBudgets(data);
    } catch (err) {
      console.error("Error loading budgets", err);
    }
  };

  const loadSummary = async () => {
    try {
      setSummaryError(null);
      const data = await getBudgetSummary(summaryCategory, summaryMonth, summaryYear);
      setSummary(data);
    } catch (err) {
      setSummary(null);
      setSummaryError(err.response?.data?.error || "Error loading budget summary.");
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  useEffect(() => {
    loadSummary();
  }, [summaryCategory, summaryMonth, summaryYear]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateBudget(editId, formData);
      } else {
        await createBudget(formData);
      }
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setFormData({
        category: 'FOOD',
        budget_amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      loadBudgets();
      loadSummary();
    } catch (err) {
      alert("Error saving budget: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleEdit = (b) => {
    setFormData({
      category: b.category,
      budget_amount: b.budget_amount,
      month: b.month,
      year: b.year
    });
    setEditId(b.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this budget limit?")) {
      try {
        await deleteBudget(id);
        loadBudgets();
        loadSummary();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <MainLayout>
      <div className="page-header">
        <h1>📊 Budgets</h1>
        <p className="page-sub">Set and track your budgets</p>
      </div>

      {/* Budget Summary / Monitor Section */}
      <div style={{ backgroundColor: '#181824', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #2e2e3e' }}>
        <h2 style={{ marginTop: 0, marginBottom: '15px' }}>🎯 Budget Monitor</h2>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Category</label>
            <select 
              value={summaryCategory} 
              onChange={(e) => setSummaryCategory(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff', minWidth: '150px' }}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Month</label>
            <select 
              value={summaryMonth} 
              onChange={(e) => setSummaryMonth(parseInt(e.target.value))}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff', minWidth: '130px' }}
            >
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Year</label>
            <input 
              type="number" 
              value={summaryYear} 
              onChange={(e) => setSummaryYear(parseInt(e.target.value))}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff', width: '100px' }}
            />
          </div>
        </div>

        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ padding: '15px', borderRadius: '8px', background: '#222232', borderLeft: '5px solid #7c3aed' }}>
              <div style={{ color: '#aaa', fontSize: '13px' }}>Budget Limit</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>₹{parseFloat(summary.budget_amount).toFixed(2)}</div>
            </div>
            <div style={{ padding: '15px', borderRadius: '8px', background: '#222232', borderLeft: '5px solid #f59e0b' }}>
              <div style={{ color: '#aaa', fontSize: '13px' }}>Total Expense</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>₹{parseFloat(summary.total_expense).toFixed(2)}</div>
            </div>
            <div style={{ padding: '15px', borderRadius: '8px', background: '#222232', borderLeft: `5px solid ${summary.remaining_budget > 0 ? '#22c55e' : '#666'}` }}>
              <div style={{ color: '#aaa', fontSize: '13px' }}>Remaining Budget</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: summary.remaining_budget > 0 ? '#22c55e' : '#fff' }}>
                ₹{parseFloat(summary.remaining_budget).toFixed(2)}
              </div>
            </div>
            {summary.overspent_amount > 0 && (
              <div style={{ padding: '15px', borderRadius: '8px', background: '#451a1a', borderLeft: '5px solid #ef4444' }}>
                <div style={{ color: '#f87171', fontSize: '13px', fontWeight: 'bold' }}>⚠️ Overspent Amount</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: '#f87171' }}>₹{parseFloat(summary.overspent_amount).toFixed(2)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📋 Budget Limits</h2>
        <button 
          onClick={() => { setShowForm(true); setIsEditing(false); }} 
          style={{ padding: '10px 20px', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ➕ Create Budget Limit
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#181824', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #2e2e3e' }}>
          <h3>{isEditing ? '✏️ Edit Budget Limit' : '➕ Set New Budget Limit'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ fontSize: '12px', color: '#aaa' }}>Category</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff', marginTop: '4px' }}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div style={{ width: '150px' }}>
                <label style={{ fontSize: '12px', color: '#aaa' }}>Budget Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={formData.budget_amount} 
                  onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })} 
                  required 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff', marginTop: '4px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#aaa' }}>Month</label>
                <select 
                  value={formData.month} 
                  onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff', marginTop: '4px' }}
                >
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#aaa' }}>Year</label>
                <input 
                  type="number" 
                  value={formData.year} 
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} 
                  required 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff', marginTop: '4px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', background: '#3e3e5e', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 16px', background: '#22c55e', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Budgets List Table */}
      <div style={{ overflowX: 'auto', background: '#181824', borderRadius: '8px', border: '1px solid #2e2e3e' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ background: '#222232', color: '#aaa', borderBottom: '1px solid #2e2e3e' }}>
              <th style={{ padding: '12px' }}>Category</th>
              <th style={{ padding: '12px' }}>Budget Limit</th>
              <th style={{ padding: '12px' }}>Period</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgets.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No budget limits configured. Create one to start monitoring!</td>
              </tr>
            ) : (
              budgets.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #2e2e3e' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>
                    <span style={{ backgroundColor: '#2e2e3e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{b.category}</span>
                  </td>
                  <td style={{ padding: '12px', color: '#7c3aed', fontWeight: 'bold' }}>₹{parseFloat(b.budget_amount).toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>
                    {MONTHS.find(m => m.value === b.month)?.label} {b.year}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleEdit(b)} style={{ marginRight: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} title="Edit">✏️</button>
                    <button onClick={() => handleDelete(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} title="Delete">❌</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
};

export default Budgets;
