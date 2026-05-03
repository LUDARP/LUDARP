import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';

const Inventory = () => {
  const { user, canAccess } = useAuth();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterProject, setFilterProject] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialForm = { project_id: '', item_name: '', unit: 'Bags', total_received: 0, total_consumed: 0, low_stock_threshold: 50 };
  const [formData, setFormData] = useState(initialForm);
  const [usageData, setUsageData] = useState({ itemId: null, amount: 0, type: 'consume' }); // consume or receive

  useEffect(() => {
    fetchData();
    const syncHandler = (e) => {
      if (e.key === 'ludarp_admin_db' || e.type === 'storage') fetchData();
    };
    window.addEventListener('storage', syncHandler);
    return () => window.removeEventListener('storage', syncHandler);
  }, [filterProject]);

  const fetchData = () => {
    let pId = filterProject;
    if (user.role === 'client' || user.role === 'contractor' || user.role === 'supervisor') {
       pId = user.project_ids[0];
       setFilterProject(pId);
    }
    setItems(adminApi.getInventory(pId));
    setProjects(adminApi.getProjects());
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ ...initialForm, project_id: filterProject === 'all' ? (projects[0]?.project_id || '') : filterProject });
    setIsModalOpen(true);
  };

  const handleEditClick = (row) => {
    setIsEditing(true);
    setFormData({ ...row });
    setIsModalOpen(true);
  };

  const handleUsageClick = (row) => {
    setUsageData({ itemId: row.id, amount: 0, type: 'consume', item: row });
    setIsUsageModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isEditing) {
      adminApi.updateInventoryItem(formData.id, formData);
      window.showToast('Material updated');
    } else {
      adminApi.addInventoryItem(formData.project_id, formData);
      window.showToast('Material added');
    }
    fetchData();
    setIsModalOpen(false);
  };

  const handleSaveUsage = (e) => {
    e.preventDefault();
    const item = adminApi.getInventory('all').find(i => i.id === usageData.itemId);
    if (!item) return;

    const amt = Number(usageData.amount);
    if (usageData.type === 'consume') {
      if (item.total_received - item.total_consumed < amt) {
        window.showToast('Cannot consume more than available stock!', 'error');
        return;
      }
      adminApi.updateInventoryItem(item.id, { total_consumed: item.total_consumed + amt });
    } else {
      adminApi.updateInventoryItem(item.id, { total_received: item.total_received + amt });
    }
    window.showToast(`Stock updated successfully`);
    fetchData();
    setIsUsageModalOpen(false);
  };

  const handleDelete = (id) => {
    if(window.confirm('Delete this material record?')) {
      adminApi.deleteInventoryItem(id);
      fetchData();
      window.showToast('Material deleted');
    }
  };

  const getStatus = (item) => {
    const remaining = item.total_received - item.total_consumed;
    if (remaining <= 0) return { label: 'Out of Stock', variant: 'danger' };
    if (remaining <= item.low_stock_threshold) return { label: 'Low Stock', variant: 'warning' };
    return { label: 'In Stock', variant: 'success' };
  };

  const columns = [
    { key: 'item_name', label: 'Material' },
    { key: 'project_name', label: 'Project', render: (row) => {
      const p = projects.find(p => p.project_id === row.project_id);
      return p ? p.project_name : row.project_id;
    }},
    { key: 'status', label: 'Status', render: (row) => {
      const status = getStatus(row);
      return <Badge variant={status.variant} label={status.label} />;
    }},
    { key: 'stock', label: 'Remaining', render: (row) => {
      const rem = row.total_received - row.total_consumed;
      return <strong>{rem} {row.unit}</strong>;
    }},
    { key: 'total_received', label: 'Total Received', render: (row) => `${row.total_received} ${row.unit}` },
    { key: 'total_consumed', label: 'Total Consumed', render: (row) => `${row.total_consumed} ${row.unit}` },
    { key: 'actions', label: 'Quick Action', render: (row) => (
      <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px', width: 'auto' }} onClick={() => handleUsageClick(row)}>Log Usage</button>
    )}
  ];

  const lowStockCount = items.filter(i => (i.total_received - i.total_consumed) <= i.low_stock_threshold).length;
  const outOfStockCount = items.filter(i => (i.total_received - i.total_consumed) <= 0).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Material & Inventory</h1>
          <p className="page-subtitle">Track site materials, prevent shortages, and monitor consumption.</p>
        </div>
        {canAccess('edit') && <button className="btn-primary" onClick={handleOpenAdd}>+ Add Material</button>}
      </div>

      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard icon="📦" label="Total Tracked Items" value={items.length} color="primary" />
        <StatCard icon="⚠️" label="Low Stock Alerts" value={lowStockCount} color="warning" />
        <StatCard icon="🛑" label="Out of Stock" value={outOfStockCount} color="danger" />
      </div>

      {user.role === 'admin' && (
        <div className="filters-bar">
          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="form-input" style={{ width: '300px' }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
          </select>
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={items} 
        onEdit={canAccess('edit') ? handleEditClick : undefined} 
        onDelete={canAccess('delete') ? handleDelete : undefined} 
      />

      {/* Add/Edit Material Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Material' : 'Add New Material'}>
        <form onSubmit={handleSave}>
           {user.role === 'admin' && (
             <FormInput label="Project" type="select" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} options={projects.map(p => p.project_id)} required />
           )}
           <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
             <FormInput label="Item Name (e.g. Portland Cement)" type="text" value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} required />
             <FormInput label="Unit (e.g. Bags, Tons)" type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} required />
           </div>
           
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput label="Brand" type="text" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="e.g. UltraTech" />
              <FormInput label="Supplier" type="text" value={formData.supplier || ''} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="e.g. Agarwal Traders" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput label="Unit Cost (₹)" type="number" value={formData.unit_cost || ''} onChange={e => setFormData({...formData, unit_cost: Number(e.target.value)})} />
              <FormInput label="Low Stock Alert Threshold" type="number" value={formData.low_stock_threshold} onChange={e => setFormData({...formData, low_stock_threshold: Number(e.target.value)})} min="0" required />
            </div>


           <div className="modal-actions">
             <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
             <button type="submit" className="btn-primary">{isEditing ? 'Save Changes' : 'Add Material'}</button>
           </div>
        </form>
      </Modal>

      {/* Log Usage Modal */}
      <Modal isOpen={isUsageModalOpen} onClose={() => setIsUsageModalOpen(false)} title="Log Stock Movement">
        <form onSubmit={handleSaveUsage}>
           <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
             <div style={{ fontWeight: 600, fontSize: '15px' }}>{usageData.item?.item_name}</div>
             <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Remaining: {usageData.item?.total_received - usageData.item?.total_consumed} {usageData.item?.unit}</div>
           </div>

           <FormInput label="Movement Type" type="select" value={usageData.type} onChange={e => setUsageData({...usageData, type: e.target.value})} options={['consume', 'receive']} required />
           
           <FormInput label={`Amount to ${usageData.type === 'consume' ? 'Deduct' : 'Add'} (${usageData.item?.unit})`} type="number" value={usageData.amount} onChange={e => setUsageData({...usageData, amount: Number(e.target.value)})} min="1" required />

           <div className="modal-actions">
             <button type="button" className="btn-secondary" onClick={() => setIsUsageModalOpen(false)}>Cancel</button>
             <button type="submit" className={usageData.type === 'consume' ? 'btn-warning' : 'btn-primary'}>{usageData.type === 'consume' ? 'Log Consumption' : 'Add Delivery'}</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
