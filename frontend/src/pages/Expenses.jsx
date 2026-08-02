import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseTotal } from '../services/expenseService';
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

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterCategory, setFilterCategory] = useState('');
  const [sortOption, setSortOption] = useState('latest');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'FOOD',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const loadData = async () => {
    try {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (sortOption) params.sort = sortOption;

      const data = await getExpenses(params);
      setExpenses(data);

      const totalData = await getExpenseTotal(params);
      setTotal(totalData.total_expense || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterCategory, sortOption]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateExpense(editId, formData);
      } else {
        await createExpense(formData);
      }
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setFormData({
        title: '',
        category: 'FOOD',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: ''
      });
      loadData();
    } catch (err) {
      alert("Error saving expense: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleEdit = (exp) => {
    setFormData({
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      expense_date: exp.expense_date,
      description: exp.description
    });
    setEditId(exp.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteExpense(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <MainLayout>
      <div className="page-header">
        <h1>💸 Expenses</h1>
        <p className="page-sub">Track your spending</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0 }}>Total Category/Filtered Expense: ₹{parseFloat(total).toFixed(2)}</h3>
        </div>
        <button 
          onClick={() => { setShowForm(true); setIsEditing(false); }} 
          style={{ padding: '10px 20px', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ➕ Add Expense
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#181824', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #2e2e3e' }}>
          <h3>{isEditing ? '✏️ Edit Expense' : '➕ Add New Expense'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Title" 
                value={formData.title} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                required 
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff', minWidth: '150px' }}
              />
              <input 
                type="number" 
                step="0.01"
                placeholder="Amount (₹)" 
                value={formData.amount} 
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                required 
                style={{ width: '120px', padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff', flex: 1 }}
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input 
                type="date" 
                value={formData.expense_date} 
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} 
                required 
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff' }}
              />
            </div>
            <textarea 
              placeholder="Description" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff', minHeight: '60px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', background: '#3e3e5e', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 16px', background: '#22c55e', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Sorting */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Filter by Category</label>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#181824', color: '#fff', minWidth: '150px' }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Sort By</label>
          <select 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#181824', color: '#fff', minWidth: '150px' }}
          >
            <option value="latest">Latest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest_amount">Highest Amount first</option>
            <option value="lowest_amount">Lowest Amount first</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div style={{ overflowX: 'auto', background: '#181824', borderRadius: '8px', border: '1px solid #2e2e3e' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ background: '#222232', color: '#aaa', borderBottom: '1px solid #2e2e3e' }}>
              <th style={{ padding: '12px' }}>Title</th>
              <th style={{ padding: '12px' }}>Category</th>
              <th style={{ padding: '12px' }}>Amount</th>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No expenses found. Add some to get started!</td>
              </tr>
            ) : (
              expenses.map(exp => (
                <tr key={exp.id} style={{ borderBottom: '1px solid #2e2e3e' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{exp.title}</td>
                  <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#2e2e3e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{exp.category}</span></td>
                  <td style={{ padding: '12px', color: '#ef4444', fontWeight: 'bold' }}>₹{parseFloat(exp.amount).toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>{exp.expense_date}</td>
                  <td style={{ padding: '12px', color: '#aaa', fontSize: '13px' }}>{exp.description || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleEdit(exp)} style={{ marginRight: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} title="Edit">✏️</button>
                    <button onClick={() => handleDelete(exp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} title="Delete">❌</button>
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

export default Expenses;
