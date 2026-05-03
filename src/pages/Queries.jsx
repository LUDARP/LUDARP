import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';

const statusMeta = {
  open:        { label: '🔴 Open',        variant: 'danger',  color: '#e74c3c' },
  'in-progress': { label: '🟡 In Progress', variant: 'warning', color: '#f39c12' },
  resolved:    { label: '🟢 Resolved',    variant: 'success', color: '#27ae60' },
  closed:      { label: '⚫ Closed',       variant: 'default', color: '#95a5a6' },
};

const priorityMeta = {
  low:    { label: 'Low',    variant: 'success' },
  medium: { label: 'Medium', variant: 'warning' },
  high:   { label: 'High',   variant: 'danger' },
};

const CATEGORIES = ['Foundation / Structure', 'Finishing & Materials', 'Plumbing & Sanitation', 'Electrical', 'Doors & Windows', 'Roofing', 'Payment & Billing', 'Timeline & Schedule', 'Design Change Request', 'General Enquiry', 'Other'];

const Queries = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const initialForm = { subject: '', category: 'General Enquiry', description: '', priority: 'medium', project_id: '' };
  const [formData, setFormData] = useState(initialForm);

  const isClient = user.role === 'client';
  const canReply = ['admin', 'engineer', 'architect', 'supervisor'].includes(user.role);

  useEffect(() => {
    let projs = adminApi.getProjects();
    if (isClient) projs = projs.filter(p => user.project_ids.includes(p.project_id));
    else if (user.role !== 'admin') projs = projs.filter(p => user.project_ids.includes(p.project_id));
    setProjects(projs);
  }, [user]);

  useEffect(() => {
    fetchData();
    const syncHandler = () => fetchData();
    window.addEventListener('storage', syncHandler);
    return () => window.removeEventListener('storage', syncHandler);
  }, [filterStatus, filterProject, user]);

  const fetchData = () => {
    let list;
    if (isClient) {
      // Client sees queries for their project only
      list = adminApi.getQueries('all').filter(q => user.project_ids.includes(q.project_id));
    } else if (user.role === 'admin') {
      list = adminApi.getQueries(filterProject);
    } else {
      list = adminApi.getQueries('all').filter(q => user.project_ids.includes(q.project_id));
    }

    if (filterStatus !== 'all') list = list.filter(q => q.status === filterStatus);

    // Enrich with project name
    list = list.map(q => {
      const proj = adminApi.getProjects().find(p => p.project_id === q.project_id);
      return { ...q, projectName: proj?.project_name || q.project_id };
    });

    setQueries(list);

    // Refresh selected if open
    if (selected) {
      const refreshed = list.find(q => q.id === selected.id);
      if (refreshed) setSelected(refreshed);
    }
  };

  const handleOpenNew = () => {
    const defaultProject = isClient ? user.project_ids[0] : (projects[0]?.project_id || '');
    setFormData({ ...initialForm, project_id: defaultProject });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const proj = adminApi.getProjects().find(p => p.project_id === formData.project_id);
    adminApi.addQuery({
      ...formData,
      submitted_by: user.user_id,
      client_name: user.name,
      project_name: proj?.project_name || ''
    });
    window.showToast('Query submitted — admin has been notified!');
    fetchData();
    setIsModalOpen(false);
  };

  const handleReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selected) return;
    adminApi.addQueryReply(selected.id, {
      from: user.name,
      from_role: user.role,
      from_id: user.user_id,
      message: replyText.trim()
    });
    // Notify client if admin/engineer replies
    if (!isClient) {
      const q = selected;
      adminApi.addNotification({
        to: q.project_id,
        type: 'query',
        title: `Reply on: ${q.subject}`,
        message: `${user.name} replied to your query.`,
        icon: '💬'
      });
    }
    window.showToast('Reply posted');
    setReplyText('');
    fetchData();
  };

  const handleStatusChange = (queryId, newStatus) => {
    adminApi.updateQueryStatus(queryId, newStatus, user.name);
    // Notify client when resolved
    if (newStatus === 'resolved') {
      const q = queries.find(q => q.id === queryId);
      if (q) adminApi.addNotification({ to: q.project_id, type: 'query', title: 'Query Resolved ✅', message: `Your query "${q.subject}" has been marked as resolved.`, icon: '✅' });
    }
    window.showToast(`Status updated to ${newStatus}`);
    fetchData();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this query?')) {
      adminApi.deleteQuery(id);
      if (selected?.id === id) setSelected(null);
      fetchData();
      window.showToast('Query deleted');
    }
  };

  const open = queries.filter(q => q.status === 'open').length;
  const inProgress = queries.filter(q => q.status === 'in-progress').length;
  const resolved = queries.filter(q => q.status === 'resolved').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">❓ Client Queries & Support</h1>
          <p className="page-subtitle">
            {isClient ? 'Submit queries about your project. Our team will respond promptly.' : 'Manage client queries, reply to questions, and track resolutions.'}
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenNew}>+ Raise Query</button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard icon="🔴" label="Open" value={open} color="danger" />
        <StatCard icon="🟡" label="In Progress" value={inProgress} color="warning" />
        <StatCard icon="🟢" label="Resolved" value={resolved} color="success" />
        <StatCard icon="📋" label="Total" value={queries.length} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {user.role === 'admin' && (
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="form-input" style={{ width: '220px' }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
          </select>
        )}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-input" style={{ width: '180px' }}>
          <option value="all">All Statuses</option>
          {Object.keys(statusMeta).map(s => <option key={s} value={s}>{statusMeta[s].label}</option>)}
        </select>
      </div>

      {/* Main layout: list + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Query List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {queries.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
              <div style={{ color: 'var(--text-muted)' }}>No queries found. {isClient ? 'Click "Raise Query" to ask your first question.' : ''}</div>
            </div>
          ) : queries.map(q => {
            const sm = statusMeta[q.status] || statusMeta.open;
            const pm = priorityMeta[q.priority] || priorityMeta.medium;
            const isSelected = selected?.id === q.id;
            const timeSince = Math.floor((new Date() - new Date(q.created_at)) / (1000 * 60 * 60 * 24));
            return (
              <div
                key={q.id}
                onClick={() => setSelected(isSelected ? null : q)}
                style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.2s', borderLeft: `4px solid ${sm.color}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{q.subject}</span>
                      <Badge label={pm.label} variant={pm.variant} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      📁 {q.projectName} · 🏷️ {q.category} · 👤 {q.client_name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {q.description}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                    <Badge label={sm.label} variant={sm.variant} />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{timeSince === 0 ? 'Today' : `${timeSince}d ago`}</span>
                    {(q.replies || []).length > 0 && <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>💬 {q.replies.length} replies</span>}
                  </div>
                </div>

                {/* Quick status change for admin/engineer */}
                {!isClient && q.status !== 'closed' && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }} onClick={e => e.stopPropagation()}>
                    {q.status !== 'in-progress' && q.status !== 'resolved' && (
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '4px 10px', width: 'auto' }} onClick={() => handleStatusChange(q.id, 'in-progress')}>Mark In Progress</button>
                    )}
                    {q.status !== 'resolved' && (
                      <button className="btn-primary" style={{ fontSize: '11px', padding: '4px 10px', background: 'var(--success)', width: 'auto' }} onClick={() => handleStatusChange(q.id, 'resolved')}>Mark Resolved</button>
                    )}
                    {q.status === 'resolved' && (
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '4px 10px', width: 'auto' }} onClick={() => handleStatusChange(q.id, 'closed')}>Close Ticket</button>
                    )}
                    {user.role === 'admin' && (
                      <button className="action-btn delete" style={{ marginLeft: 'auto' }} onClick={() => handleDelete(q.id)}>🗑️</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail / Thread Panel */}
        {selected && (
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', position: 'sticky', top: '80px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{selected.subject}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Ticket #{selected.id.slice(-8).toUpperCase()}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>

            {/* Tracking Info */}
            <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {[
                ['Status', <Badge label={statusMeta[selected.status]?.label} variant={statusMeta[selected.status]?.variant} />],
                ['Priority', <Badge label={selected.priority} variant={priorityMeta[selected.priority]?.variant} />],
                ['Category', selected.category],
                ['Project', selected.projectName],
                ['Raised by', selected.client_name],
                ['Opened', new Date(selected.created_at).toLocaleDateString('en-GB')],
                ...(selected.resolved_at ? [['Resolved', new Date(selected.resolved_at).toLocaleDateString('en-GB')], ['Resolved by', selected.resolved_by]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ flex: '1 1 40%' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Original Query */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Original Query</div>
              <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text)' }}>{selected.description}</div>
            </div>

            {/* Reply Thread */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(selected.replies || []).length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No replies yet.</div>
              ) : (selected.replies || []).map(r => {
                const isStaff = r.from_role !== 'client';
                return (
                  <div key={r.id} style={{ display: 'flex', gap: '10px', flexDirection: isStaff ? 'row' : 'row-reverse' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isStaff ? 'var(--accent)' : 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      {r.from?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexDirection: isStaff ? 'row' : 'row-reverse' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{r.from}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{r.from_role}</span>
                      </div>
                      <div style={{ background: isStaff ? '#f0f6ff' : '#f0fff4', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', lineHeight: '1.5', textAlign: isStaff ? 'left' : 'right' }}>
                        {r.message}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: isStaff ? 'left' : 'right' }}>
                        {new Date(r.created_at).toLocaleString('en-GB')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Box */}
            {selected.status !== 'closed' && (
              <form onSubmit={handleReply} style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={isClient ? 'Add more details...' : 'Reply to client...'}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px', flexShrink: 0 }}>Send</button>
              </form>
            )}
            {selected.status === 'closed' && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>This ticket is closed.</div>
            )}
          </div>
        )}
      </div>

      {/* New Query Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Raise a Query">
        <form onSubmit={handleSubmit}>
          {!isClient && (
            <FormInput label="Project" type="select" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} options={projects.map(p => ({value: p.project_id, label: p.project_name}))} required />
          )}
          <FormInput label="Subject / Title" type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="e.g. Foundation crack concern" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormInput label="Category" type="select" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} options={CATEGORIES} required />
            <FormInput label="Priority" type="select" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} options={['low','medium','high']} required />
          </div>
          <FormInput label="Detailed Description" type="textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe your concern or question in detail..." required />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Submit Query</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Queries;
