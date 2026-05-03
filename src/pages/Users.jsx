import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialForm = { user_id: '', password: '', name: '', role: 'engineer', email: '', phone: '', avatar: '', project_ids: [] };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setUsers(adminApi.getUsers());
    setProjects(adminApi.getProjects());
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleEditClick = (row) => {
    setIsEditing(true);
    setFormData({ ...row });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();

    // basic validation
    if(formData.password.length < 6) {
      window.showToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (isEditing) {
      adminApi.updateUser(formData.user_id, formData);
      window.showToast('User updated successfully');
    } else {
      // Create avatar (first letters)
      const initials = formData.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
      const newUser = { ...formData, avatar: initials };
      // Check if user ID exists
      if(users.find(u => u.user_id === newUser.user_id)) {
        window.showToast('User ID already exists', 'error');
        return;
      }
      adminApi.addUser(newUser);
      window.showToast('User created successfully');
    }

    fetchData();
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (id === user.user_id) {
      window.showToast('Cannot delete yourself', 'error');
      return;
    }
    adminApi.deleteUser(id);
    fetchData();
    window.showToast('User deleted');
  };

  const toggleProjectMapping = (pid) => {
    setFormData(prev => {
      const pids = prev.project_ids || [];
      if(pids.includes(pid)) return { ...prev, project_ids: pids.filter(id => id !== pid) };
      return { ...prev, project_ids: [...pids, pid] };
    });
  };

  const columns = [
    { key: 'user_id', label: 'ID', render: (row) => <span style={{fontFamily:'monospace', fontWeight:600}}>{row.user_id}</span> },
    { key: 'name', label: 'Name', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
         <div className="user-avatar" style={{ background: 'var(--accent)', width: '28px', height: '28px', fontSize: '11px' }}>{row.avatar}</div>
         <strong style={{color:'var(--accent)'}}>{row.name}</strong>
      </div>
    )},
    { key: 'role', label: 'Role', render: (row) => <Badge variant={row.role} label={row.role} /> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'projects_assigned', label: 'Assigned To', render: (row) => (
      row.role === 'admin' ? <Badge variant="gray" label="ALL PROJECTS" /> : 
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{row.project_ids.length} projects</span>
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage platform access, roles, and project assignments.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>+ Add User</button>
      </div>

      <DataTable columns={columns} data={users} onEdit={handleEditClick} onDelete={handleDelete} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit User' : 'Add New User'}>
        <form onSubmit={handleSave}>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput label="Full Name" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <FormInput label="User ID" type="text" value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value.trim()})} disabled={isEditing} placeholder="U005" required />
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <FormInput label="Role" type="select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} options={['admin', 'engineer', 'architect', 'supervisor', 'contractor']} required />
             <FormInput label="Password" type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Min 6 chars" required />
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <FormInput label="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
             <FormInput label="Phone Number" type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
           </div>

           {formData.role !== 'admin' && (
             <div className="form-group" style={{ background: '#f8f9fa', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
               <label className="form-label">Assign Projects (Access Rights)</label>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                 {projects.map(p => (
                   <label key={p.project_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                     <input 
                       type="checkbox" 
                       checked={formData.project_ids.includes(p.project_id)} 
                       onChange={() => toggleProjectMapping(p.project_id)} 
                     />
                     {p.project_name} <span style={{color: 'var(--text-muted)'}}>({p.project_id})</span>
                   </label>
                 ))}
               </div>
             </div>
           )}

           <div className="modal-actions">
             <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
             <button type="submit" className="btn-primary">Save User</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
