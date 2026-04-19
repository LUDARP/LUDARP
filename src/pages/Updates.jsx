import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Loader from '../components/Loader';
import UpdateCard from '../components/UpdateCard';
import Modal from '../components/Modal';

const Updates = ({ isAdmin }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ description: '', image_url: '', date: new Date().toISOString().split('T')[0] });

  const fetchUpdates = () => {
    const projectId = localStorage.getItem('ludarp_project_id');
    const res = api.getUpdates(projectId);
    if (res?.success) {
      setUpdates(res.data);
    } else {
      setError('Failed to fetch updates');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handlePostUpdate = (e) => {
    e.preventDefault();
    const projectId = localStorage.getItem('ludarp_project_id');
    if(newUpdate.description) {
      api.addUpdate(projectId, newUpdate);
      fetchUpdates();
      setIsModalOpen(false);
      setNewUpdate({ description: '', image_url: '', date: new Date().toISOString().split('T')[0] });
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Site Updates</h1>
        {isAdmin && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setIsModalOpen(true)}>
            + Post Update
          </button>
        )}
      </div>

      <div>
        {updates.length > 0 ? (
          updates.map((upd, idx) => (
            <UpdateCard key={idx} update={upd} />
          ))
        ) : (
          <p className="muted">No updates available at this time.</p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Post Site Update">
        <form onSubmit={handlePostUpdate}>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={newUpdate.description} onChange={e => setNewUpdate({...newUpdate, description: e.target.value})} required></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Image URL (Optional)</label>
            <input type="text" className="form-input" placeholder="https://images.unsplash.com/photo-..." value={newUpdate.image_url} onChange={e => setNewUpdate({...newUpdate, image_url: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={newUpdate.date} onChange={e => setNewUpdate({...newUpdate, date: e.target.value})} required />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Updates;
