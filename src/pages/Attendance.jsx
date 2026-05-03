import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import StatCard from '../components/StatCard';

const Attendance = () => {
  const { user, canAccess } = useAuth();
  const [records, setRecords] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterProject, setFilterProject] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ project_id: '', date: new Date().toISOString().split('T')[0], trade: 'Mason', count: 1, daily_rate: 800 });

  useEffect(() => {
    let projs = adminApi.getProjects();
    if(user.role !== 'admin') projs = projs.filter(p => user.project_ids.includes(p.project_id));
    setProjects(projs);
  }, [user]);

  useEffect(() => {
    fetchData();
    const syncHandler = (e) => {
      if (e.key === 'ludarp_admin_db' || e.type === 'storage') fetchData();
    };
    window.addEventListener('storage', syncHandler);
    return () => window.removeEventListener('storage', syncHandler);
  }, [filterProject, projects]);

  const fetchData = () => {
    let pId = filterProject;
    if (user.role === 'client' || user.role === 'contractor' || user.role === 'supervisor') {
       pId = user.project_ids[0];
       setFilterProject(pId);
    }
    const list = adminApi.getAttendance(pId).map(a => {
      const p = adminApi.getProjects().find(proj => proj.project_id === a.project_id);
      return { ...a, projectName: p ? p.project_name : a.project_id };
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
    setRecords(list);
  };

  const handleOpenAdd = () => {
    setFormData({ project_id: filterProject === 'all' ? (projects[0]?.project_id || '') : filterProject, date: new Date().toISOString().split('T')[0], trade: 'Mason', count: 1, daily_rate: 800 });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    adminApi.addAttendance(formData.project_id, {
      ...formData,
      count: Number(formData.count),
      daily_rate: Number(formData.daily_rate),
      total_wage: Number(formData.count) * Number(formData.daily_rate),
      added_by: user.user_id
    });
    window.showToast('Workforce log added successfully');
    fetchData();
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if(window.confirm('Delete this attendance record?')) {
      adminApi.deleteAttendance(id);
      fetchData();
      window.showToast('Record deleted');
    }
  };

  const columns = [
    { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString('en-GB') },
    { key: 'projectName', label: 'Project' },
    { key: 'trade', label: 'Trade / Role' },
    { key: 'count', label: 'Headcount', render: (row) => <strong>{row.count}</strong> },
    { key: 'daily_rate', label: 'Daily Rate', render: (row) => `₹${row.daily_rate.toLocaleString('en-IN')}` },
    { key: 'total_wage', label: 'Total Wage', render: (row) => <span className="amount">₹{row.total_wage.toLocaleString('en-IN')}</span> }
  ];

  const totalWorkersToday = records.filter(r => r.date === new Date().toISOString().split('T')[0]).reduce((sum, r) => sum + r.count, 0);
  const totalWagesToday = records.filter(r => r.date === new Date().toISOString().split('T')[0]).reduce((sum, r) => sum + r.total_wage, 0);
  const totalWagesOverall = records.reduce((sum, r) => sum + r.total_wage, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Workforce & Attendance</h1>
          <p className="page-subtitle">Track daily labor count and wage calculations.</p>
        </div>
        {canAccess('edit') && <button className="btn-primary" onClick={handleOpenAdd}>+ Log Attendance</button>}
      </div>

      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard icon="👷" label="Workers Today" value={totalWorkersToday} color="primary" />
        <StatCard icon="💸" label="Wages Today" value={`₹${totalWagesToday.toLocaleString('en-IN')}`} color="warning" />
        <StatCard icon="💰" label="Total Wages Logged" value={`₹${totalWagesOverall.toLocaleString('en-IN')}`} color="danger" />
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
        data={records} 
        onDelete={canAccess('delete') ? handleDelete : undefined} 
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Daily Attendance">
        <form onSubmit={handleSave}>
           {user.role === 'admin' && (
             <FormInput label="Project" type="select" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} options={projects.map(p => p.project_id)} required />
           )}
           <FormInput label="Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
           
           <FormInput label="Trade / Role" type="select" value={formData.trade} onChange={e => setFormData({...formData, trade: e.target.value})} options={['Mason', 'Helper', 'Carpenter', 'Electrician', 'Plumber', 'Painter', 'Site Supervisor']} required />
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <FormInput label="Headcount" type="number" value={formData.count} onChange={e => setFormData({...formData, count: Number(e.target.value)})} min="1" required />
             <FormInput label="Daily Rate (₹)" type="number" value={formData.daily_rate} onChange={e => setFormData({...formData, daily_rate: Number(e.target.value)})} min="0" required />
           </div>

           <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginTop: '8px', marginBottom: '16px' }}>
             <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Estimated Total Wage</div>
             <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--danger)' }}>₹{(formData.count * formData.daily_rate).toLocaleString('en-IN')}</div>
           </div>

           <div className="modal-actions">
             <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
             <button type="submit" className="btn-primary">Save Attendance</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};

export default Attendance;
