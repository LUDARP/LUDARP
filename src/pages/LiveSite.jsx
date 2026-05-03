import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import StatCard from '../components/StatCard';

const LiveSite = () => {
  const { user, canAccess } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [feed, setFeed] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ embed_url: '', status: 'online' });

  useEffect(() => {
    let projs = adminApi.getProjects();
    if (user.role !== 'admin') projs = projs.filter(p => user.project_ids.includes(p.project_id));
    setProjects(projs);
    if (projs.length > 0) setSelectedProjectId(projs[0].project_id);
  }, [user]);

  useEffect(() => {
    if (selectedProjectId) {
      setFeed(adminApi.getLiveFeed(selectedProjectId));
    }
  }, [selectedProjectId]);

  const handleUpdate = (e) => {
    e.preventDefault();
    adminApi.updateLiveFeed(selectedProjectId, formData);
    window.showToast('Camera feed updated');
    setFeed(adminApi.getLiveFeed(selectedProjectId));
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📡 Live Site Monitoring</h1>
          <p className="page-subtitle">Real-time camera feeds and site snapshot history.</p>
        </div>
        {canAccess('edit') && <button className="btn-primary" onClick={() => { setFormData({ embed_url: feed?.embed_url || '', status: feed?.status || 'online' }); setIsModalOpen(true); }}>⚙️ Configure Camera</button>}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div className="form-label" style={{ marginBottom: '8px' }}>Switch Project Camera</div>
        <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="form-select" style={{ width: '300px' }}>
          {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        <div style={{ background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', minHeight: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', position: 'relative' }}>
          {feed?.embed_url ? (
            <iframe 
              src={feed.embed_url} 
              style={{ width: '100%', height: '480px', border: 'none' }} 
              allow="autoplay; encrypted-media" 
              allowFullScreen 
              title="Live Site Feed"
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎥</div>
              <div>No live camera feed configured for this project.</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>Paste a YouTube Live, Twitch, or IP Camera URL to start.</div>
            </div>
          )}
          <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: feed?.status === 'online' ? '#22c55e' : '#ef4444', animation: feed?.status === 'online' ? 'pulse 1.5s infinite' : 'none' }} />
            LIVE — SITE {selectedProjectId.toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <StatCard icon="🛰️" label="Feed Status" value={feed?.status?.toUpperCase() || 'OFFLINE'} color={feed?.status === 'online' ? 'success' : 'danger'} />
          
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>📸 Recent Snapshots</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ aspectRatio: '16/9', background: 'var(--border)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
                  Snapshot {i}
                </div>
              ))}
            </div>
            <button className="btn-secondary" style={{ width: '100%', marginTop: '16px', fontSize: '12px' }} onClick={() => window.showToast('Capturing manual snapshot...')}>Take Snapshot</button>
          </div>
          
          <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: '16px', fontSize: '12px', color: 'var(--accent)' }}>
            <strong>Privacy Tip:</strong> Only authorized roles (Admin, Client, Engineer) can view the live site feed. Ensure camera URLs are HTTPS.
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure Project Camera">
        <form onSubmit={handleUpdate}>
          <FormInput label="Camera Embed URL" type="text" value={formData.embed_url} onChange={e => setFormData({...formData, embed_url: e.target.value})} placeholder="https://www.youtube.com/embed/..." required />
          <FormInput label="System Status" type="select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} options={['online', 'offline', 'maintenance']} />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Configuration</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LiveSite;
