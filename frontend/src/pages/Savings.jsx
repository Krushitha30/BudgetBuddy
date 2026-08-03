import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  getSavingsGoalProgress,
} from '../services/savingsService';

const STATUS_COLORS = {
  IN_PROGRESS: { bg: 'rgba(77,166,255,0.15)', color: '#4da6ff', label: '🔵 In Progress' },
  COMPLETED:   { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', label: '✅ Completed'   },
  CANCELLED:   { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', label: '❌ Cancelled'   },
};

const emptyForm = {
  goal_name: '',
  target_amount: '',
  saved_amount: '',
  target_date: '',
  status: 'IN_PROGRESS',
};

export default function Savings() {
  const [goals, setGoals]           = useState([]);
  const [progress, setProgress]     = useState({});
  const [form, setForm]             = useState(emptyForm);
  const [editId, setEditId]         = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await getSavingsGoals();
      setGoals(data);
      // Fetch progress for each goal
      const progressMap = {};
      await Promise.all(
        data.map(async (g) => {
          try {
            progressMap[g.id] = await getSavingsGoalProgress(g.id);
          } catch {}
        })
      );
      setProgress(progressMap);
    } catch (err) {
      setError('Failed to load savings goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await updateSavingsGoal(editId, form);
      } else {
        await createSavingsGoal(form);
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      fetchGoals();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.values(data).flat().join(' ');
        setError(msgs);
      } else {
        setError('Failed to save goal.');
      }
    }
  };

  const handleEdit = (goal) => {
    setForm({
      goal_name: goal.goal_name,
      target_amount: goal.target_amount,
      saved_amount: goal.saved_amount,
      target_date: goal.target_date,
      status: goal.status,
    });
    setEditId(goal.id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this savings goal?')) return;
    try {
      await deleteSavingsGoal(id);
      fetchGoals();
    } catch {
      setError('Failed to delete goal.');
    }
  };

  const totalSaved  = goals.reduce((s, g) => s + parseFloat(g.saved_amount || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.target_amount || 0), 0);
  const completed   = goals.filter(g => g.status === 'COMPLETED').length;

  return (
    <MainLayout>
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🎯 Savings Goals</h1>
            <p style={styles.subtitle}>Track your financial goals and monitor progress</p>
          </div>
          <button style={styles.addBtn} onClick={() => { setShowForm(!showForm); setForm(emptyForm); setEditId(null); setError(''); }}>
            {showForm ? '✕ Cancel' : '+ New Goal'}
          </button>
        </div>

        {/* Summary Cards */}
        <div style={styles.cardRow}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>🎯</div>
            <div style={styles.cardLabel}>Total Goals</div>
            <div style={styles.cardValue}>{goals.length}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardIcon}>💰</div>
            <div style={styles.cardLabel}>Total Saved</div>
            <div style={{ ...styles.cardValue, color: '#22c55e' }}>₹{totalSaved.toFixed(2)}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardIcon}>🏁</div>
            <div style={styles.cardLabel}>Target Amount</div>
            <div style={{ ...styles.cardValue, color: '#4da6ff' }}>₹{totalTarget.toFixed(2)}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardIcon}>✅</div>
            <div style={styles.cardLabel}>Completed</div>
            <div style={{ ...styles.cardValue, color: '#a78bfa' }}>{completed}</div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>{editId ? '✏️ Update Savings Goal' : '➕ Create New Goal'}</h3>
            {error && <div style={styles.errorBox}>{error}</div>}
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Goal Name *</label>
                  <input style={styles.input} type="text" placeholder="e.g. Laptop Fund"
                    value={form.goal_name} onChange={e => setForm({ ...form, goal_name: e.target.value })} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Status</label>
                  <select style={styles.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Target Amount (₹) *</label>
                  <input style={styles.input} type="number" min="0.01" step="0.01" placeholder="e.g. 50000"
                    value={form.target_amount} onChange={e => setForm({ ...form, target_amount: e.target.value })} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Saved Amount (₹)</label>
                  <input style={styles.input} type="number" min="0" step="0.01" placeholder="e.g. 10000"
                    value={form.saved_amount} onChange={e => setForm({ ...form, saved_amount: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Target Date *</label>
                  <input style={styles.input} type="date"
                    value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} required />
                </div>
              </div>
              <button type="submit" style={styles.submitBtn}>{editId ? '💾 Update Goal' : '🎯 Create Goal'}</button>
            </form>
          </div>
        )}

        {/* Goals List */}
        {loading ? (
          <div style={styles.emptyState}>Loading savings goals...</div>
        ) : goals.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <p>No savings goals yet. Create your first goal!</p>
          </div>
        ) : (
          <div style={styles.goalGrid}>
            {goals.map((goal) => {
              const p = progress[goal.id];
              const pct = p ? Math.min(p.progress_percentage, 100) : 0;
              const st  = STATUS_COLORS[goal.status] || STATUS_COLORS.IN_PROGRESS;
              return (
                <div key={goal.id} style={styles.goalCard}>
                  {/* Top row */}
                  <div style={styles.goalHeader}>
                    <h3 style={styles.goalName}>{goal.goal_name}</h3>
                    <span style={{ ...styles.statusBadge, background: st.bg, color: st.color }}>{st.label}</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={styles.progressWrap}>
                    <div style={styles.progressBg}>
                      <div style={{
                        ...styles.progressFill,
                        width: `${pct}%`,
                        background: pct >= 100 ? '#22c55e' : pct >= 50 ? '#4da6ff' : '#a78bfa'
                      }} />
                    </div>
                    <span style={styles.progressPct}>{pct.toFixed(1)}%</span>
                  </div>

                  {/* Stats */}
                  <div style={styles.statsRow}>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Saved</span>
                      <span style={{ ...styles.statVal, color: '#22c55e' }}>₹{parseFloat(goal.saved_amount).toFixed(2)}</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Target</span>
                      <span style={{ ...styles.statVal, color: '#4da6ff' }}>₹{parseFloat(goal.target_amount).toFixed(2)}</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Remaining</span>
                      <span style={{ ...styles.statVal, color: '#f59e0b' }}>
                        ₹{p ? Math.max(p.remaining_amount, 0).toFixed(2) : '--'}
                      </span>
                    </div>
                  </div>

                  <div style={styles.targetDate}>📅 Target: {goal.target_date}</div>

                  {/* Actions */}
                  <div style={styles.actions}>
                    <button style={styles.editBtn} onClick={() => handleEdit(goal)}>✏️ Edit</button>
                    <button style={styles.delBtn} onClick={() => handleDelete(goal.id)}>🗑️ Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

const styles = {
  page:        { minHeight: '100vh' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title:       { fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 },
  subtitle:    { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  addBtn:      { background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 },

  cardRow:     { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 },
  card:        { background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: 12, padding: 20, textAlign: 'center' },
  cardIcon:    { fontSize: 28, marginBottom: 8 },
  cardLabel:   { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  cardValue:   { fontSize: 22, fontWeight: 700, color: '#fff' },

  formCard:    { background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: 14, padding: 24, marginBottom: 28 },
  formTitle:   { color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 16, marginTop: 0 },
  errorBox:    { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#f87171', marginBottom: 14, fontSize: 13 },
  form:        { display: 'flex', flexDirection: 'column', gap: 16 },
  formRow:     { display: 'flex', gap: 16 },
  formGroup:   { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  label:       { fontSize: 13, color: '#94a3b8', fontWeight: 500 },
  input:       { background: '#252538', border: '1px solid #33334d', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none' },
  submitBtn:   { background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', cursor: 'pointer', fontWeight: 600, fontSize: 14, alignSelf: 'flex-start' },

  emptyState:  { textAlign: 'center', color: '#64748b', padding: '60px 0' },

  goalGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 20 },
  goalCard:    { background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: 14, padding: 20 },
  goalHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  goalName:    { color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 },
  statusBadge: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 },

  progressWrap:{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  progressBg:  { flex: 1, height: 8, background: '#2a2a40', borderRadius: 99, overflow: 'hidden' },
  progressFill:{ height: '100%', borderRadius: 99, transition: 'width 0.5s ease' },
  progressPct: { color: '#94a3b8', fontSize: 12, fontWeight: 600, minWidth: 40, textAlign: 'right' },

  statsRow:    { display: 'flex', justifyContent: 'space-between', marginBottom: 12 },
  stat:        { display: 'flex', flexDirection: 'column', gap: 4 },
  statLabel:   { fontSize: 11, color: '#64748b' },
  statVal:     { fontSize: 15, fontWeight: 700 },

  targetDate:  { fontSize: 12, color: '#64748b', marginBottom: 14 },
  actions:     { display: 'flex', gap: 8 },
  editBtn:     { flex: 1, background: 'rgba(77,166,255,0.1)', color: '#4da6ff', border: '1px solid rgba(77,166,255,0.2)', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  delBtn:      { flex: 1, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
};
