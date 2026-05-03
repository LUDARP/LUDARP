import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';

const statusVariant = { pending: 'warning', approved: 'success', rejected: 'danger', 'needs-revision': 'info' };
const statusIcon = { pending: '⏳', approved: '✅', rejected: '❌', 'needs-revision': '🔄' };

const Approvals = () => {
  const { user, canAccess } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewModal, setReviewModal] = useState({ open: false, item: null, decision: '' });
  const initialForm = { project_id: '', title: '', type: 'Document', description: '', file_url: '' };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    let projs = adminApi.getProjects();
    if(user.role !== 'admin') projs = projs.filter(p => user.project_ids.includes(p.project_id));
    setProjects(projs);
  }, [user]);

  useEffect(() => { fetchData(); }, [filterProject, filterStatus]);

  const fetchData = () => {
    let list = adminApi.getApprovals(filterProject);
    if (filterStatus !== 'all') list = list.filter(a => a.status === filterStatus);
    // Enrich
    list = list.map(a => {
      const proj = adminApi.getProjects().find(p => p.project_id === a.project_id);
      const submitter = adminApi.getUsers().find(u => u.user_id === a.submitted_by);
      return { ...a, projectName: proj?.project_name || a.project_id, submitterName: submitter?.name || a.submitted_by };
    }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    setApprovals(list);
  };

  const handleOpenSubmit = () => {
    setFormData({ ...initialForm, project_id: filterProject === 'all' ? (projects[0]?.project_id || '') : filterProject });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    adminApi.addApproval(formData.project_id, { ...formData, submitted_by: user.user_id });
    window.showToast('Approval request submitted');
    fetchData();
    setIsModalOpen(false);
  };

  const handleReview = (item, decision) => setReviewModal({ open: true, item, decision });

  const handleFinalReview = (e) => {
    e.preventDefault();
    adminApi.updateApproval(reviewModal.item.id, { status: reviewModal.decision, reviewed_by: user.user_id, review_comment: reviewModal.comment || '' });
    window.showToast(`Request ${reviewModal.decision}`);
    fetchData();
    setReviewModal({ open: false, item: null, decision: '' });
  };

  const canReview = user.role === 'admin' || user.role === 'engineer';

  const pending = approvals.filter(a => a.status === 'pending').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval & Workflow</h1>
          <p className="page-subtitle">Submit items for review and track the approval chain.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenSubmit}>+ Request Approval</button>
      </div>

      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard icon="📋" label="Total Requests" value={approvals.length} />
        <StatCard icon="⏳" label="Pending Review" value={pending} color="warning" />
        <StatCard icon="✅" label="Approved" value={approvals.filter(a => a.status === 'approved').length} color="success" />
        <StatCard icon="❌" label="Rejected" value={approvals.filter(a => a.status === 'rejected').length} color="danger" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {user.role === 'admin' && (
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="form-input" style={{ width: '220px' }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
          </select>
        )}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-input" style={{ width: '180px' }}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="needs-revision">Needs Revision</option>
        </select>
      </div>

      {/* Approval Cards */}
      {approvals.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📑</div>
          <div>No approval requests found.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {approvals.map(item => (
            <div key={item.id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '28px' }}>{statusIcon[item.status]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>{item.title}</span>
                  <Badge label={item.type} variant="info" />
                  <Badge label={item.status} variant={statusVariant[item.status]} />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {item.projectName} · Submitted by <strong>{item.submitterName}</strong> · {new Date(item.created_at).toLocaleDateString('en-GB')}
                </div>
                {item.description && <div style={{ fontSize: '13px', marginTop: '6px' }}>{item.description}</div>}
                {item.review_comment && <div style={{ fontSize: '12px', marginTop: '6px', padding: '8px', background: 'var(--border)', borderRadius: '6px' }}>💬 Review note: {item.review_comment}</div>}
              </div>
              {canReview && item.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px', background: 'var(--success)' }} onClick={() => handleReview(item, 'approved')}>Approve</button>
                  <button className="btn-danger" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => handleReview(item, 'rejected')}>Reject</button>
                  <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => handleReview(item, 'needs-revision')}>Revise</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Approval">
        <form onSubmit={handleSubmit}>
          <FormInput label="Project" type="select" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} options={projects.map(p => ({value: p.project_id, label: p.project_name}))} required />
          <FormInput label="Request Title" type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Structural Drawing v3 Approval" />
          <FormInput label="Type" type="select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} options={['Document','Design Change','Material Change','Payment','Site Access','Other']} />
          <FormInput label="Description / Notes" type="textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <FormInput label="File / Reference URL (Optional)" type="text" value={formData.file_url} onChange={e => setFormData({...formData, file_url: e.target.value})} placeholder="https://..." />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Submit for Approval</button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={reviewModal.open} onClose={() => setReviewModal({ open: false })} title={`${reviewModal.decision === 'approved' ? '✅ Approve' : reviewModal.decision === 'rejected' ? '❌ Reject' : '🔄 Request Revision'}: ${reviewModal.item?.title || ''}`}>
        <form onSubmit={handleFinalReview}>
          <FormInput label="Review Comment (Optional)" type="textarea" value={reviewModal.comment || ''} onChange={e => setReviewModal(prev => ({...prev, comment: e.target.value}))} placeholder="Leave a note for the submitter..." />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setReviewModal({ open: false })}>Cancel</button>
            <button type="submit" className={reviewModal.decision === 'approved' ? 'btn-primary' : 'btn-danger'} style={{ background: reviewModal.decision === 'approved' ? 'var(--success)' : undefined }}>Confirm {reviewModal.decision}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Approvals;
