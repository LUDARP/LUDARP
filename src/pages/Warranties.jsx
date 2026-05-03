import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';

const Warranties = () => {
  const { user, canAccess } = useAuth();
  const [warranties, setWarranties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterProject, setFilterProject] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initialForm = { project_id: '', product_name: '', supplier: '', brand: '', warranty_start: '', warranty_end: '', notes: '' };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchData();
  }, [filterProject, user]);

  const fetchData = () => {
    let projs = adminApi.getProjects();
    if (user.role !== 'admin') projs = projs.filter(p => user.project_ids.includes(p.project_id));
    setProjects(projs);

    const list = adminApi.getWarranties(filterProject).map(w => {
      const p = adminApi.getProjectById(w.project_id);
      return { ...w, projectName: p ? p.project_name : w.project_id };
    });
    setWarranties(list);
  };

  const handleSave = (e) => {
    e.preventDefault();
    adminApi.addWarranty(formData);
    window.showToast('Warranty record added');
    fetchData();
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this warranty record?')) {
      adminApi.deleteWarranty(id);
      fetchData();
      window.showToast('Record removed');
    }
  };

  const getStatus = (expiry) => {
    if (!expiry) return { label: 'Unknown', variant: 'gray' };
    const days = Math.floor((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: 'Expired', variant: 'danger' };
    if (days < 30) return { label: 'Expiring Soon', variant: 'warning' };
    return { label: 'Active', variant: 'success' };
  };

  const columns = [
    { key: 'product_name', label: 'Product', render: (row) => <strong>{row.product_name}</strong> },
    { key: 'projectName', label: 'Project' },
    { key: 'supplier', label: 'Supplier / Brand', render: (row) => `${row.supplier} (${row.brand})` },
    { key: 'expiry', label: 'Status', render: (row) => {
      const s = getStatus(row.warranty_end);
      return <Badge label={s.label} variant={s.variant} />;
    }},
    { key: 'warranty_end', label: 'Expiry Date', render: (row) => new Date(row.warranty_end).toLocaleDateString('en-GB') }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ Warranty Management</h1>
          <p className="page-subtitle">Track warranties for fixtures, equipment, and building products.</p>
        </div>
        {canAccess('edit') && <button className="btn-primary" onClick={() => { setFormData({...initialForm, project_id: projects[0]?.project_id || ''}); setIsModalOpen(true); }}>+ Add Warranty</button>}
      </div>

      {user.role === 'admin' && (
        <div style={{ marginBottom: '20px' }}>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="form-input" style={{ width: '250px' }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
          </select>
        </div>
      )}

      <DataTable columns={columns} data={warranties} onDelete={handleDelete} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Product Warranty">
        <form onSubmit={handleSave}>
          <FormInput label="Project" type="select" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} options={projects.map(p => ({value: p.project_id, label: p.project_name}))} required />
          <FormInput label="Product Name" type="text" value={formData.product_name} onChange={e => setFormData({...formData, product_name: e.target.value})} placeholder="e.g. Havells Geyser 25L" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormInput label="Supplier" type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} required />
            <FormInput label="Brand" type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormInput label="Warranty Start" type="date" value={formData.warranty_start} onChange={e => setFormData({...formData, warranty_start: e.target.value})} required />
            <FormInput label="Warranty Expiry" type="date" value={formData.warranty_end} onChange={e => setFormData({...formData, warranty_end: e.target.value})} required />
          </div>
          <FormInput label="Notes" type="textarea" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Record</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Warranties;
