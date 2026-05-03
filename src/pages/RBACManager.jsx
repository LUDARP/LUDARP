import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';

const ALL_FEATURES_LIST = [
  'projects','progress','costs','updates','documents','logs',
  'inventory','attendance','scheduler','approvals','invoices',
  'bim','kpi','edit','delete'
];

const FEATURE_LABELS = {
  projects:'📁 Projects', progress:'📊 Progress', costs:'💰 Costs',
  updates:'📸 Updates', documents:'📄 Documents', logs:'📝 Daily Logs',
  inventory:'📦 Inventory', attendance:'👷 Workforce', scheduler:'📅 Scheduler',
  approvals:'📑 Approvals', invoices:'🧾 Invoices', bim:'🧱 BIM Viewer',
  kpi:'📊 KPI Dashboard', edit:'✏️ Edit Data', delete:'🗑️ Delete Data'
};

const RBACManager = () => {
  const { user, BASE_PERMISSIONS } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [expiryModal, setExpiryModal] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    fetchData();
    const sync = () => fetchData();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const fetchData = () => {
    setUsers(adminApi.getUsers().filter(u => u.user_id !== 'U001'));
    setProjects(adminApi.getProjects());
    if (selected) {
      const refreshed = adminApi.getUsers().find(u => u.user_id === selected.user_id);
      if (refreshed) setSelected(refreshed);
    }
  };

  const basePerms = (role) => BASE_PERMISSIONS?.[role] || [];

  const isBasePermission = (u, feature) => basePerms(u.role).includes(feature);
  const isCustomGranted = (u, feature) => (u.custom_permissions || []).includes(feature) && !isBasePermission(u, feature);

  const toggleFeature = (userId, feature, hasIt) => {
    if (hasIt) {
      adminApi.revokeCustomPermission(userId, feature);
      window.showToast(`Revoked: ${feature}`);
    } else {
      adminApi.grantCustomPermission(userId, feature);
      window.showToast(`Granted: ${feature}`);
    }
    fetchData();
  };

  const toggleProject = (userId, projectId, hasIt) => {
    const u = users.find(u => u.user_id === userId);
    if (!u) return;
    const current = u.project_ids || [];
    const updated = hasIt ? current.filter(p => p !== projectId) : [...current, projectId];
    adminApi.setProjectAccess(userId, updated);
    window.showToast(`Project access ${hasIt ? 'removed' : 'granted'}`);
    fetchData();
  };

  const handleSetExpiry = (e) => {
    e.preventDefault();
    adminApi.setAccessExpiry(selected.user_id, expiryDate || null);
    window.showToast(expiryDate ? `Access expires ${new Date(expiryDate).toLocaleDateString('en-GB')}` : 'Access expiry removed');
    fetchData();
    setExpiryModal(false);
  };

  const isExpired = (u) => u.access_expires && new Date(u.access_expires) < new Date();

  const totalCustom = users.reduce((s, u) => s + (u.custom_permissions?.length || 0), 0);
  const expiring = users.filter(u => u.access_expires && new Date(u.access_expires) > new Date() && (new Date(u.access_expires) - new Date()) < 7 * 86400000).length;
  const expired = users.filter(u => isExpired(u)).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🔐 Advanced RBAC Manager</h1>
          <p className="page-subtitle">Fine-tune permissions per user, grant project-specific access, and set temporary expiry dates.</p>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard icon="👥" label="Managed Users" value={users.length} />
        <StatCard icon="🎯" label="Custom Grants" value={totalCustom} color="primary" />
        <StatCard icon="⏰" label="Expiring Soon" value={expiring} color="warning" />
        <StatCard icon="🚫" label="Expired Access" value={expired} color="danger" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '300px 1fr' : '1fr', gap: '24px' }}>

        {/* User List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Select User to Configure</div>
          {users.map(u => (
            <div key={u.user_id} onClick={() => setSelected(u)} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: `2px solid ${selected?.user_id === u.user_id ? 'var(--accent)' : 'var(--border)'}`, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isExpired(u) ? '#ef4444' : 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                  {u.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{u.name}</div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                    <Badge label={u.role} variant="info" />
                    {isExpired(u) && <Badge label="🚫 Expired" variant="danger" />}
                    {u.access_expires && !isExpired(u) && <Badge label="⏰ Expiry Set" variant="warning" />}
                    {(u.custom_permissions || []).length > 0 && <Badge label={`+${u.custom_permissions.length} custom`} variant="success" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Permission Editor */}
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* User Header */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: isExpired(selected) ? '#ef4444' : 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px' }}>
                {selected.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '16px' }}>{selected.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{selected.email} · {selected.role}</div>
                {selected.access_expires && (
                  <div style={{ fontSize: '12px', marginTop: '4px', color: isExpired(selected) ? 'var(--danger)' : '#f59e0b', fontWeight: 600 }}>
                    {isExpired(selected) ? '🚫 Access EXPIRED ' : '⏰ Expires '} {new Date(selected.access_expires).toLocaleDateString('en-GB')}
                  </div>
                )}
              </div>
              <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', width: 'auto' }} onClick={() => { setExpiryDate(selected.access_expires || ''); setExpiryModal(true); }}>
                ⏰ Set Expiry
              </button>
            </div>

            {/* Feature Permissions */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                <span>🎯 Feature Permissions</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🔵 Base Role · 🟢 Custom Grant · ⚪ No Access</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0', padding: '8px' }}>
                {ALL_FEATURES_LIST.map(feature => {
                  const isBase = isBasePermission(selected, feature);
                  const isCustom = isCustomGranted(selected, feature);
                  const hasAccess = isBase || isCustom;
                  return (
                    <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '6px', margin: '2px', background: isBase ? '#eff6ff' : isCustom ? '#f0fdf4' : 'transparent', border: `1px solid ${isBase ? '#bfdbfe' : isCustom ? '#bbf7d0' : 'var(--border)'}` }}>
                      <button
                        onClick={() => !isBase && toggleFeature(selected.user_id, feature, isCustom)}
                        disabled={isBase}
                        style={{ width: '20px', height: '20px', borderRadius: '4px', border: 'none', cursor: isBase ? 'not-allowed' : 'pointer', background: isBase ? '#3b82f6' : isCustom ? '#22c55e' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}
                        title={isBase ? 'Base role permission (cannot revoke)' : isCustom ? 'Click to revoke' : 'Click to grant'}
                      >
                        {isBase ? '🔵' : isCustom ? '✓' : ''}
                      </button>
                      <span style={{ fontSize: '12px', fontWeight: hasAccess ? 600 : 400, color: hasAccess ? 'var(--text)' : 'var(--text-muted)' }}>
                        {FEATURE_LABELS[feature] || feature}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)', background: '#f8f9fa' }}>
                🔵 Base role permissions cannot be removed. Grant/revoke custom permissions above.
              </div>
            </div>

            {/* Project Access */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>🏗️ Project Access</div>
              <div style={{ padding: '12px' }}>
                {projects.map(proj => {
                  const hasAccess = selected.project_ids?.includes(proj.project_id);
                  return (
                    <div key={proj.project_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '6px', margin: '4px 0', background: hasAccess ? '#f0fdf4' : '#f8f9fa', border: `1px solid ${hasAccess ? '#bbf7d0' : 'var(--border)'}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{proj.project_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{proj.location}</div>
                      </div>
                      <button
                        onClick={() => toggleProject(selected.user_id, proj.project_id, hasAccess)}
                        style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: hasAccess ? 'var(--success)' : 'white', color: hasAccess ? 'white' : 'var(--text)', borderColor: hasAccess ? 'var(--success)' : 'var(--border)' }}
                      >
                        {hasAccess ? '✅ Has Access' : '+ Grant'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expiry Modal */}
      <Modal isOpen={expiryModal} onClose={() => setExpiryModal(false)} title={`Set Access Expiry — ${selected?.name}`}>
        <form onSubmit={handleSetExpiry}>
          <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#92400e' }}>
            ⏰ When this date passes, the user's access will be automatically blocked until an admin resets or removes the expiry.
          </div>
          <FormInput label="Access Expiry Date" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => { setExpiryDate(''); handleSetExpiry({ preventDefault: () => {} }); setExpiryModal(false); }}>Remove Expiry</button>
            <button type="button" className="btn-secondary" onClick={() => setExpiryModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Set Expiry</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RBACManager;
