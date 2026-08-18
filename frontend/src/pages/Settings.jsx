import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';
import './Dashboard.css';

const Settings = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [form, setForm] = useState({ username: '', email: '' });
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Password form state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    api.get('/users/profile/')
      .then(res => {
        setProfile(res.data);
        setForm({ username: res.data.username || '', email: res.data.email || '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) {
      setProfileMsg({ text: 'Username and email are required.', type: 'error' });
      return;
    }
    setSaving(true);
    setProfileMsg({ text: '', type: '' });
    try {
      const res = await api.patch('/users/profile/', { username: form.username, email: form.email });
      setProfile(res.data);
      setProfileMsg({ text: '✅ Profile updated successfully!', type: 'success' });
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.username?.[0] || data?.email?.[0] || 'Failed to update profile.';
      setProfileMsg({ text: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg({ text: '', type: '' });
    if (!pwForm.current_password || !pwForm.new_password || !pwForm.confirm_password) {
      setPwMsg({ text: 'All password fields are required.', type: 'error' });
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwMsg({ text: 'New password must be at least 8 characters.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/users/change-password/', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwMsg({ text: '✅ Password changed successfully!', type: 'success' });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const data = err.response?.data;
      setPwMsg({ text: data?.error || data?.detail || 'Failed to change password.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#252538',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle = { fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' };

  const msgStyle = (type) => ({
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
    background: type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
    color: type === 'success' ? '#22c55e' : '#ef4444',
    border: `1px solid ${type === 'success' ? '#22c55e' : '#ef4444'}`,
  });

  const tabs = [
    { id: 'profile', label: '👤 Profile Info' },
    { id: 'password', label: '🔒 Change Password' },
    { id: 'account', label: '📋 Account Info' },
  ];

  return (
    <MainLayout>
      <div className="page-header">
        <h1>⚙️ Settings</h1>
        <p className="page-sub">Manage your account settings and preferences</p>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>Loading settings...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', alignItems: 'start' }}>

          {/* Tab Sidebar */}
          <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                background: activeTab === tab.id ? '#6c63ff' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: activeTab === tab.id ? '#fff' : '#94a3b8',
                padding: '10px 14px',
                textAlign: 'left',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? '600' : '400'
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ background: '#1e1e2f', border: '1px solid #2a2a40', borderRadius: '14px', padding: '28px' }}>

            {/* Profile Info Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px', marginTop: 0, marginBottom: '24px' }}>👤 Profile Information</h2>
                {profileMsg.text && <div style={msgStyle(profileMsg.type)}>{profileMsg.text}</div>}
                <form onSubmit={handleProfileSave}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={labelStyle}>Username</label>
                      <input style={inputStyle} type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Enter username" required />
                    </div>
                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Enter email" required />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} style={{
                    background: '#6c63ff', color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '12px 28px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                  }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px', marginTop: 0, marginBottom: '24px' }}>🔒 Change Password</h2>
                {pwMsg.text && <div style={msgStyle(pwMsg.type)}>{pwMsg.text}</div>}
                <form onSubmit={handlePasswordChange}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={labelStyle}>Current Password</label>
                      <input style={inputStyle} type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} placeholder="Enter current password" />
                    </div>
                    <div>
                      <label style={labelStyle}>New Password</label>
                      <input style={inputStyle} type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} placeholder="Enter new password (min 8 chars)" />
                    </div>
                    <div>
                      <label style={labelStyle}>Confirm New Password</label>
                      <input style={inputStyle} type="password" value={pwForm.confirm_password} onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })} placeholder="Confirm new password" />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} style={{
                    background: '#6c63ff', color: '#fff', border: 'none', borderRadius: '8px',
                    padding: '12px 28px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                  }}>
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Account Info Tab */}
            {activeTab === 'account' && (
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px', marginTop: 0, marginBottom: '24px' }}>📋 Account Information</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[
                    { label: 'User ID', value: `#${profile?.id}`, icon: '🆔' },
                    { label: 'Username', value: profile?.username, icon: '👤' },
                    { label: 'Email Address', value: profile?.email, icon: '📧' },
                    { label: 'Account Type', value: 'Standard User', icon: '🏷️' },
                    { label: 'Auth Method', value: 'JWT Token', icon: '🔑' },
                    { label: 'Status', value: 'Active ✅', icon: '📡' },
                  ].map((item, idx) => (
                    <div key={idx} style={{ background: '#252538', borderRadius: '10px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                        <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '600', marginTop: '2px' }}>{item.value || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Settings;
