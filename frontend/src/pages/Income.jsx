import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { getIncomes, createIncome, updateIncome, deleteIncome } from '../services/incomeService';
import './Dashboard.css';

const SOURCES = [
  'SALARY',
  'POCKET_MONEY',
  'SCHOLARSHIP',
  'FREELANCING',
  'BUSINESS',
  'OTHER'
];

const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [total, setTotal] = useState(0);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    source: 'SALARY',
    amount: '',
    income_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const loadData = async () => {
    try {
      const data = await getIncomes();
      setIncomes(data);
      
      const sum = data.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
      setTotal(sum);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateIncome(editId, formData);
      } else {
        await createIncome(formData);
      }
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setFormData({
        title: '',
        source: 'SALARY',
        amount: '',
        income_date: new Date().toISOString().split('T')[0],
        description: ''
      });
      loadData();
    } catch (err) {
      alert("Error saving income: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleEdit = (inc) => {
    setFormData({
      title: inc.title,
      source: inc.source,
      amount: inc.amount,
      income_date: inc.income_date,
      description: inc.description
    });
    setEditId(inc.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this income entry?")) {
      try {
        await deleteIncome(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <MainLayout>
      <div className="page-header">
        <h1>💵 Income</h1>
        <p className="page-sub">Manage your income sources</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0 }}>Total Income: ₹{parseFloat(total).toFixed(2)}</h3>
        </div>
        <button 
          onClick={() => { setShowForm(true); setIsEditing(false); }} 
          style={{ padding: '10px 20px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ➕ Add Income
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#181824', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #2e2e3e' }}>
          <h3>{isEditing ? '✏️ Edit Income' : '➕ Add New Income'}</h3>
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
                value={formData.source} 
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #2e2e3e', background: '#222232', color: '#fff', flex: 1 }}
              >
                {SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
              </select>
              <input 
                type="date" 
                value={formData.income_date} 
                onChange={(e) => setFormData({ ...formData, income_date: e.target.value })} 
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

      {/* Income Table */}
      <div style={{ overflowX: 'auto', background: '#181824', borderRadius: '8px', border: '1px solid #2e2e3e' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ background: '#222232', color: '#aaa', borderBottom: '1px solid #2e2e3e' }}>
              <th style={{ padding: '12px' }}>Title</th>
              <th style={{ padding: '12px' }}>Source</th>
              <th style={{ padding: '12px' }}>Amount</th>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incomes.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No income entries found. Add one to get started!</td>
              </tr>
            ) : (
              incomes.map(inc => (
                <tr key={inc.id} style={{ borderBottom: '1px solid #2e2e3e' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{inc.title}</td>
                  <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#2e2e3e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{inc.source}</span></td>
                  <td style={{ padding: '12px', color: '#22c55e', fontWeight: 'bold' }}>₹{parseFloat(inc.amount).toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>{inc.income_date}</td>
                  <td style={{ padding: '12px', color: '#aaa', fontSize: '13px' }}>{inc.description || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleEdit(inc)} style={{ marginRight: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} title="Edit">✏️</button>
                    <button onClick={() => handleDelete(inc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }} title="Delete">❌</button>
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

export default Income;
