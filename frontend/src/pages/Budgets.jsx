import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { getBudgets, createBudget, updateBudget, deleteBudget, getBudgetSummary, getBudgetAlert } from '../services/budgetService';
import './Dashboard.css';

const CATEGORIES = [
  'FOOD', 'TRAVEL', 'SHOPPING', 'EDUCATION',
  'ENTERTAINMENT', 'HEALTHCARE', 'BILLS', 'MISCELLANEOUS'
];

const MONTHS = [
  { value: 1, label: 'January' },   { value: 2,  label: 'February' },
  { value: 3, label: 'March' },     { value: 4,  label: 'April' },
  { value: 5, label: 'May' },       { value: 6,  label: 'June' },
  { value: 7, label: 'July' },      { value: 8,  label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

// --- Alert config ---
const ALERT_CONFIG = {
  NONE:         { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: '#22c55e', label: '✅ On Track',       barColor: '#22c55e' },
  WARNING:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: '#f59e0b', label: '⚠️ 80% Warning',    barColor: '#f59e0b' },
  HIGH_WARNING: { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: '#f97316', label: '🚨 90% High Alert', barColor: '#f97316' },
  EXCEEDED:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: '#ef4444', label: '🔴 Exceeded',       barColor: '#ef4444' },
};

const Budgets = () => {
  const [budgets, setBudgets]       = useState([]);
  const [alerts, setAlerts]         = useState([]);   // [{...alertData}]
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Summary monitor
  const [summaryCategory, setSummaryCategory] = useState('FOOD');
  const [summaryMonth,    setSummaryMonth]     = useState(new Date().getMonth() + 1);
  const [summaryYear,     setSummaryYear]      = useState(new Date().getFullYear());
  const [summary,         setSummary]          = useState(null);
  const [summaryError,    setSummaryError]     = useState(null);

  // Form
  const [showForm, setShowForm]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [formData,  setFormData]  = useState({
    category: 'FOOD', budget_amount: '',
    month: new Date().getMonth() + 1, year: new Date().getFullYear()
  });

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const loadBudgets = async () => {
    try {
      const data = await getBudgets();
      setBudgets(data);
      loadAlerts(data);
    } catch (err) {
      console.error('Error loading budgets', err);
    }
  };

  const loadAlerts = async (budgetList) => {
    setAlertsLoading(true);
    const results = await Promise.all(
      (budgetList || budgets).map(async (b) => {
        try {
          return await getBudgetAlert(b.category, b.month, b.year);
        } catch {
          return null;
        }
      })
    );
    setAlerts(results.filter(Boolean));
    setAlertsLoading(false);
  };

  const loadSummary = async () => {
    try {
      setSummaryError(null);
      const data = await getBudgetSummary(summaryCategory, summaryMonth, summaryYear);
      setSummary(data);
    } catch (err) {
      setSummary(null);
      setSummaryError(err.response?.data?.error || 'Error loading summary.');
    }
  };

  useEffect(() => { loadBudgets(); }, []);
  useEffect(() => { loadSummary(); }, [summaryCategory, summaryMonth, summaryYear]);

  // ── Form handlers ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) { await updateBudget(editId, formData); }
      else           { await createBudget(formData); }
      setShowForm(false); setIsEditing(false); setEditId(null);
      setFormData({ category: 'FOOD', budget_amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
      loadBudgets(); loadSummary();
    } catch (err) {
      alert('Error saving budget: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleEdit = (b) => {
    setFormData({ category: b.category, budget_amount: b.budget_amount, month: b.month, year: b.year });
    setEditId(b.id); setIsEditing(true); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this budget limit?')) {
      try { await deleteBudget(id); loadBudgets(); loadSummary(); }
      catch (err) { console.error(err); }
    }
  };

  // Alerts sorted: EXCEEDED → HIGH_WARNING → WARNING → NONE
  const alertOrder = { EXCEEDED: 0, HIGH_WARNING: 1, WARNING: 2, NONE: 3 };
  const sortedAlerts = [...alerts].sort((a, b) => (alertOrder[a.alert_level] ?? 9) - (alertOrder[b.alert_level] ?? 9));
  const hasActiveAlerts = alerts.some(a => a.alert_level !== 'NONE');

  return (
    <MainLayout>
      <div className="page-header">
        <h1>📊 Budgets</h1>
        <p className="page-sub">Set, monitor, and track your budgets with real-time alerts</p>
      </div>

      {/* ── BUDGET ALERTS SECTION ─────────────────────────────────────────────── */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          <h2 style={s.sectionTitle}>
            🔔 Budget Alerts
            {hasActiveAlerts && <span style={s.alertDot}>{alerts.filter(a => a.alert_level !== 'NONE').length}</span>}
          </h2>
          <button style={s.refreshBtn} onClick={() => loadAlerts()}>🔄 Refresh</button>
        </div>

        {alertsLoading ? (
          <p style={s.muted}>Loading alert data…</p>
        ) : alerts.length === 0 ? (
          <p style={s.muted}>No budgets found. Create a budget to start monitoring alerts.</p>
        ) : (
          <div style={s.alertGrid}>
            {sortedAlerts.map((a, i) => {
              const cfg = ALERT_CONFIG[a.alert_level] || ALERT_CONFIG.NONE;
              const pct = Math.min(a.budget_utilization_percentage, 100);
              return (
                <div key={i} style={{ ...s.alertCard, borderColor: cfg.border, background: cfg.bg }}>
                  {/* Top row */}
                  <div style={s.alertCardTop}>
                    <span style={s.alertCat}>{a.budget_category}</span>
                    <span style={{ ...s.alertBadge, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={s.barWrap}>
                    <div style={s.barBg}>
                      <div style={{ ...s.barFill, width: `${pct}%`, background: cfg.barColor }} />
                    </div>
                    <span style={{ ...s.barPct, color: cfg.color }}>
                      {a.budget_utilization_percentage.toFixed(1)}%
                    </span>
                  </div>

                  {/* Stats row */}
                  <div style={s.alertStats}>
                    <div style={s.alertStat}>
                      <span style={s.statLbl}>Budget</span>
                      <span style={s.statVal}>₹{a.budget_amount.toFixed(2)}</span>
                    </div>
                    <div style={s.alertStat}>
                      <span style={s.statLbl}>Spent</span>
                      <span style={{ ...s.statVal, color: cfg.color }}>₹{a.total_expense.toFixed(2)}</span>
                    </div>
                    <div style={s.alertStat}>
                      <span style={s.statLbl}>Remaining</span>
                      <span style={{ ...s.statVal, color: '#22c55e' }}>
                        ₹{Math.max(a.budget_amount - a.total_expense, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Alert message */}
                  {a.alert_level !== 'NONE' && (
                    <div style={{ ...s.alertMsg, color: cfg.color }}>
                      {a.alert_message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── BUDGET MONITOR ────────────────────────────────────────────────────── */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>🎯 Budget Monitor</h2>
        <div style={{ display: 'flex', gap: 15, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Category', node: (
              <select value={summaryCategory} onChange={e => setSummaryCategory(e.target.value)} style={s.sel}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            )},
            { label: 'Month', node: (
              <select value={summaryMonth} onChange={e => setSummaryMonth(parseInt(e.target.value))} style={s.sel}>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            )},
            { label: 'Year', node: (
              <input type="number" value={summaryYear} onChange={e => setSummaryYear(parseInt(e.target.value))} style={{ ...s.sel, width: 100 }} />
            )},
          ].map(({ label, node }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8' }}>{label}</label>
              {node}
            </div>
          ))}
        </div>

        {summaryError && <p style={{ color: '#f87171', fontSize: 13 }}>{summaryError}</p>}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 15 }}>
            {[
              { label: 'Budget Limit',      val: `₹${parseFloat(summary.budget_amount).toFixed(2)}`,    accent: '#7c3aed' },
              { label: 'Total Expense',     val: `₹${parseFloat(summary.total_expense).toFixed(2)}`,    accent: '#f59e0b' },
              { label: 'Remaining Budget',  val: `₹${parseFloat(summary.remaining_budget).toFixed(2)}`, accent: summary.remaining_budget > 0 ? '#22c55e' : '#666' },
              ...(summary.overspent_amount > 0
                ? [{ label: '⚠️ Overspent', val: `₹${parseFloat(summary.overspent_amount).toFixed(2)}`, accent: '#ef4444' }]
                : []),
            ].map(({ label, val, accent }) => (
              <div key={label} style={{ padding: 15, borderRadius: 8, background: '#222232', borderLeft: `5px solid ${accent}` }}>
                <div style={{ color: '#aaa', fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 5, color: accent }}>{val}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BUDGET LIMITS TABLE ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>📋 Budget Limits</h2>
        <button onClick={() => { setShowForm(true); setIsEditing(false); }} style={s.addBtn}>
          ➕ Create Budget Limit
        </button>
      </div>

      {showForm && (
        <div style={s.formBox}>
          <h3 style={{ marginTop: 0 }}>{isEditing ? '✏️ Edit Budget Limit' : '➕ Set New Budget Limit'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={s.lbl}>Category</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ ...s.inp, width: '100%' }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ width: 160 }}>
                <label style={s.lbl}>Budget Amount (₹)</label>
                <input type="number" step="0.01" placeholder="0.00"
                  value={formData.budget_amount} onChange={e => setFormData({ ...formData, budget_amount: e.target.value })}
                  required style={{ ...s.inp, width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={s.lbl}>Month</label>
                <select value={formData.month} onChange={e => setFormData({ ...formData, month: parseInt(e.target.value) })} style={{ ...s.inp, width: '100%' }}>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.lbl}>Year</label>
                <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} required style={{ ...s.inp, width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
              <button type="submit" style={s.saveBtn}>Save</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto', background: '#181824', borderRadius: 8, border: '1px solid #2e2e3e' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
          <thead>
            <tr style={{ background: '#222232', color: '#aaa', borderBottom: '1px solid #2e2e3e' }}>
              <th style={{ padding: 12 }}>Category</th>
              <th style={{ padding: 12 }}>Budget Limit</th>
              <th style={{ padding: 12 }}>Period</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgets.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', color: '#666' }}>No budget limits configured. Create one to start monitoring!</td></tr>
            ) : budgets.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid #2e2e3e' }}>
                <td style={{ padding: 12, fontWeight: 'bold' }}>
                  <span style={{ backgroundColor: '#2e2e3e', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>{b.category}</span>
                </td>
                <td style={{ padding: 12, color: '#7c3aed', fontWeight: 'bold' }}>₹{parseFloat(b.budget_amount).toFixed(2)}</td>
                <td style={{ padding: 12 }}>{MONTHS.find(m => m.value === b.month)?.label} {b.year}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  <button onClick={() => handleEdit(b)} style={{ marginRight: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✏️</button>
                  <button onClick={() => handleDelete(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  section:      { backgroundColor: '#181824', padding: 20, borderRadius: 10, marginBottom: 28, border: '1px solid #2e2e3e' },
  sectionHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sectionTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 },
  alertDot:     { background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  refreshBtn:   { background: '#252538', border: '1px solid #33334d', color: '#94a3b8', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13 },
  muted:        { color: '#64748b', fontSize: 14 },

  alertGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 },
  alertCard:    { border: '1px solid', borderRadius: 12, padding: 16, transition: 'transform .2s', cursor: 'default' },
  alertCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  alertCat:     { fontWeight: 700, fontSize: 15, color: '#fff' },
  alertBadge:   { fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'transparent' },

  barWrap:      { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  barBg:        { flex: 1, height: 10, background: '#1a1a2e', borderRadius: 99, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 99, transition: 'width .5s ease' },
  barPct:       { fontWeight: 700, fontSize: 13, minWidth: 45, textAlign: 'right' },

  alertStats:   { display: 'flex', justifyContent: 'space-between', marginBottom: 10 },
  alertStat:    { display: 'flex', flexDirection: 'column', gap: 3 },
  statLbl:      { fontSize: 11, color: '#64748b' },
  statVal:      { fontSize: 14, fontWeight: 700, color: '#fff' },

  alertMsg:     { fontSize: 12, marginTop: 6, padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6 },

  sel:          { padding: 8, borderRadius: 4, border: '1px solid #2e2e3e', background: '#222232', color: '#fff' },
  lbl:          { fontSize: 12, color: '#aaa', display: 'block', marginBottom: 4 },
  inp:          { padding: 8, borderRadius: 4, border: '1px solid #2e2e3e', background: '#222232', color: '#fff' },

  addBtn:       { padding: '10px 20px', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' },
  formBox:      { backgroundColor: '#181824', padding: 20, borderRadius: 10, marginBottom: 20, border: '1px solid #2e2e3e' },
  cancelBtn:    { padding: '8px 16px', background: '#3e3e5e', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' },
  saveBtn:      { padding: '8px 16px', background: '#22c55e', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' },
};

export default Budgets;
