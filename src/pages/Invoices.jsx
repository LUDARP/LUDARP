import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';

const statusVariant = { unpaid: 'danger', partial: 'warning', paid: 'success' };
const statusIcon = { unpaid: '❌', partial: '⚠️', paid: '✅' };

const Invoices = () => {
  const { user, canAccess } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterProject, setFilterProject] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payModal, setPayModal] = useState({ open: false, invoice: null });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const initialForm = { project_id: '', title: '', milestone: '', amount: '', due_date: '', notes: '' };
  const [formData, setFormData] = useState(initialForm);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Bank Transfer');

  useEffect(() => {
    let projs = adminApi.getProjects();
    if(user.role !== 'admin') projs = projs.filter(p => user.project_ids.includes(p.project_id));
    setProjects(projs);
  }, [user]);

  useEffect(() => { fetchData(); }, [filterProject]);

  const fetchData = () => {
    let list = adminApi.getInvoices(filterProject).map(inv => {
      const proj = adminApi.getProjects().find(p => p.project_id === inv.project_id);
      return { ...inv, projectName: proj?.project_name || inv.project_id };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setInvoices(list);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const inv = adminApi.addInvoice(formData.project_id, { ...formData, amount: Number(formData.amount), paid_amount: 0, created_by: user.user_id });
    // Auto-notify client
    const proj = adminApi.getProjects().find(p => p.project_id === formData.project_id);
    if (proj) adminApi.addNotification({ to: proj.project_id, type: 'invoice', title: 'New Invoice', message: `Invoice "${formData.title}" for ₹${Number(formData.amount).toLocaleString('en-IN')} has been issued.`, icon: '🧾' });
    window.showToast('Invoice created & client notified');
    fetchData();
    setIsModalOpen(false);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    adminApi.addPayment(payModal.invoice.id, { amount: Number(payAmount), mode: payMode });
    window.showToast('Payment recorded');
    fetchData();
    if (selectedInvoice?.id === payModal.invoice.id) {
      const updated = adminApi.getInvoices('all').find(i => i.id === payModal.invoice.id);
      setSelectedInvoice(updated);
    }
    setPayModal({ open: false, invoice: null });
    setPayAmount('');
  };

  const handleDelete = (id) => {
    if(window.confirm('Delete this invoice?')) { adminApi.deleteInvoice(id); fetchData(); window.showToast('Invoice deleted'); if(selectedInvoice?.id === id) setSelectedInvoice(null); }
  };

  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0);
  const totalCollected = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0);
  const totalPending = totalBilled - totalCollected;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoice & Payment</h1>
          <p className="page-subtitle">Generate invoices, track milestone payments, and manage client billing.</p>
        </div>
        {canAccess('edit') && <button className="btn-primary" onClick={() => { setFormData({...initialForm, project_id: projects[0]?.project_id || ''}); setIsModalOpen(true); }}>+ Create Invoice</button>}
      </div>

      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard icon="🧾" label="Total Billed" value={`₹${totalBilled.toLocaleString('en-IN')}`} />
        <StatCard icon="✅" label="Collected" value={`₹${totalCollected.toLocaleString('en-IN')}`} color="success" />
        <StatCard icon="⏳" label="Outstanding" value={`₹${totalPending.toLocaleString('en-IN')}`} color="danger" />
        <StatCard icon="📋" label="Total Invoices" value={invoices.length} />
      </div>

      {user.role === 'admin' && (
        <div className="filters-bar" style={{ marginBottom: '20px' }}>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="form-input" style={{ width: '280px' }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedInvoice ? '1fr 380px' : '1fr', gap: '24px' }}>
        {/* Invoice List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {invoices.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧾</div>
              <div style={{ color: 'var(--text-muted)' }}>No invoices yet. Create the first one!</div>
            </div>
          ) : invoices.map(inv => {
            const pct = inv.amount > 0 ? Math.min(100, ((inv.paid_amount || 0) / inv.amount) * 100) : 0;
            return (
              <div key={inv.id} onClick={() => setSelectedInvoice(inv)} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: `2px solid ${selectedInvoice?.id === inv.id ? 'var(--accent)' : 'var(--border)'}`, padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{inv.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{inv.projectName} · {inv.milestone}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge label={`${statusIcon[inv.status]} ${inv.status}`} variant={statusVariant[inv.status]} />
                    {canAccess('delete') && <button className="action-btn delete" onClick={e => { e.stopPropagation(); handleDelete(inv.id); }}>🗑️</button>}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Invoice Amount</span>
                  <span style={{ fontWeight: 700, fontSize: '16px' }}>₹{inv.amount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: '99px', height: '8px', marginBottom: '8px' }}>
                  <div style={{ width: `${pct}%`, height: '8px', borderRadius: '99px', background: inv.status === 'paid' ? 'var(--success)' : 'var(--accent)', transition: 'width 0.5s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Paid: ₹{(inv.paid_amount || 0).toLocaleString('en-IN')}</span>
                  <span>Due: ₹{(inv.amount - (inv.paid_amount || 0)).toLocaleString('en-IN')}</span>
                </div>
                {inv.status !== 'paid' && canAccess('edit') && (
                  <button className="btn-primary" style={{ width: '100%', marginTop: '12px', padding: '8px' }} onClick={e => { e.stopPropagation(); setPayModal({ open: true, invoice: inv }); setPayAmount(''); }}>
                    💳 Record Payment
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selectedInvoice && (
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '24px', height: 'fit-content', position: 'sticky', top: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Invoice Detail</h3>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>{selectedInvoice.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{selectedInvoice.projectName}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {[['Milestone', selectedInvoice.milestone], ['Amount', `₹${selectedInvoice.amount?.toLocaleString('en-IN')}`], ['Due Date', selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString('en-GB') : 'N/A'], ['Status', selectedInvoice.status?.toUpperCase()]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', textTransform: 'uppercase' }}>Payment History</div>
            {(selectedInvoice.payments || []).length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No payments yet.</div> : (selectedInvoice.payments || []).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span>₹{Number(p.amount).toLocaleString('en-IN')} via {p.mode}</span>
                <span style={{ color: 'var(--text-muted)' }}>{new Date(p.date).toLocaleDateString('en-GB')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Invoice">
        <form onSubmit={handleCreate}>
          <FormInput label="Project" type="select" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} options={projects.map(p => ({value: p.project_id, label: p.project_name}))} required />
          <FormInput label="Invoice Title" type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Foundation Work Invoice" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormInput label="Milestone / Stage" type="text" value={formData.milestone} onChange={e => setFormData({...formData, milestone: e.target.value})} placeholder="e.g. Foundation" required />
            <FormInput label="Amount (₹)" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} min="1" required />
          </div>
          <FormInput label="Due Date" type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
          <FormInput label="Notes" type="textarea" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create Invoice</button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={payModal.open} onClose={() => setPayModal({ open: false })} title={`Record Payment — ${payModal.invoice?.title}`}>
        <form onSubmit={handlePayment}>
          <div style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Remaining Balance</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--danger)' }}>₹{((payModal.invoice?.amount || 0) - (payModal.invoice?.paid_amount || 0)).toLocaleString('en-IN')}</div>
          </div>
          <FormInput label="Payment Amount (₹)" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} min="1" required />
          <FormInput label="Payment Mode" type="select" value={payMode} onChange={e => setPayMode(e.target.value)} options={['Bank Transfer', 'Cheque', 'Cash', 'UPI', 'NEFT/RTGS']} />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setPayModal({ open: false })}>Cancel</button>
            <button type="submit" className="btn-primary">Confirm Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Invoices;
