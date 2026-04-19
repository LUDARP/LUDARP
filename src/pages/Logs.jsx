import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import StatCard from '../components/StatCard';

const Logs = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [logs, setLogs] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLog, setNewLog] = useState({ 
    project_id: '', 
    date: new Date().toISOString().split('T')[0], 
    work_done: '', 
    labor_count: '', 
    issues: '' 
  });

  useEffect(() => {
    let projs = adminApi.getProjects();
    if(user.role !== 'admin') projs = projs.filter(p => user.project_ids.includes(p.project_id));
    setProjects(projs);
    if(projs.length > 0 && selectedProjectId === 'all' && user.role !== 'admin') {
      setSelectedProjectId(projs[0].project_id);
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [selectedProjectId, user]);

  const fetchLogs = () => {
    let list = adminApi.getLogs(selectedProjectId);
    
    // Filter by user access if 'all' is selected
    if (selectedProjectId === 'all' && user.role !== 'admin') {
      list = list.filter(l => user.project_ids.includes(l.project_id));
    }

    const enrichedList = list.map(l => {
       const author = adminApi.getUsers().find(us => us.user_id === l.added_by);
       const p = adminApi.getProjectById(l.project_id);
       return { 
         ...l, 
         authorName: author ? author.name : l.added_by, 
         projectName: p ? p.project_name : l.project_id 
       };
    });
    setLogs(enrichedList);
  };

  const handleAddLog = (e) => {
    e.preventDefault();
    adminApi.addLog(newLog.project_id, {
      ...newLog,
      added_by: user.user_id
    });
    
    fetchLogs();
    setIsModalOpen(false);
    setNewLog({ ...newLog, work_done: '', labor_count: '', issues: '' });
    window.showToast('Daily log saved');
  };

  const handleDelete = (id) => {
    adminApi.deleteLog(id);
    fetchLogs();
    window.showToast('Log entry removed');
  };

  const columns = [
    { key: 'date', label: 'Date', render: (row) => <strong>{new Date(row.date).toLocaleDateString('en-GB')}</strong> },
    { key: 'projectName', label: 'Project' },
    { key: 'work_done', label: 'Work Done', render: (row) => <span title={row.work_done}>{row.work_done.substring(0, 50)}...</span> },
    { key: 'labor_count', label: 'Labours', render: (row) => <span className="badge badge-info">{row.labor_count}</span> },
    { key: 'issues', label: 'Issues', render: (row) => <span style={{color: row.issues ? 'var(--danger)' : 'var(--text-muted)'}}>{row.issues || 'None'}</span> },
    { key: 'authorName', label: 'Reported By' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Execution Logs</h1>
          <p className="page-subtitle">Track daily manpower and site activities.</p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
           {projects.length > 1 && (
             <div>
               <div className="form-label" style={{ marginBottom: '4px', textAlign: 'left' }}>Filter by Project</div>
               <select className="form-select" style={{ width: '250px' }} value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                 <option value="all">All Projects</option>
                 {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
               </select>
             </div>
           )}
           <button className="btn-primary" style={{ padding: '10px 20px', height: '41px' }} onClick={() => setIsModalOpen(true)}>+ New Log</button>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '24px' }}>
         <StatCard icon="👷" label="Reports Today" value={logs.filter(l => l.date === new Date().toISOString().split('T')[0]).length} />
         <StatCard icon="👥" label="Avg Labours" value={logs.length ? Math.round(logs.reduce((s,l)=>s+Number(l.labor_count),0)/logs.length) : 0} color="info" />
         <StatCard icon="⚠️" label="Open Issues" value={logs.filter(l => l.issues).length} color="danger" />
      </div>

      <DataTable columns={columns} data={logs} onDelete={handleDelete} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Daily Site Report">
        <form onSubmit={handleAddLog}>
           <FormInput 
             label="Project" 
             type="select" 
             value={newLog.project_id} 
             onChange={e => setNewLog({...newLog, project_id: e.target.value})} 
             options={projects.map(p => ({value: p.project_id, label: p.project_name}))} 
             required 
           />
           <FormInput 
             label="Report Date" 
             type="date" 
             value={newLog.date} 
             onChange={e => setNewLog({...newLog, date: e.target.value})} 
             required 
           />
           <FormInput 
             label="Work Completed Today" 
             type="textarea" 
             value={newLog.work_done} 
             onChange={e => setNewLog({...newLog, work_done: e.target.value})} 
             placeholder="Describe what was achieved..."
             required 
           />
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput 
                label="Total Manpower" 
                type="number" 
                value={newLog.labor_count} 
                onChange={e => setNewLog({...newLog, labor_count: e.target.value})} 
                required 
              />
              <FormInput 
                label="Issues / Obstacles" 
                type="text" 
                value={newLog.issues} 
                onChange={e => setNewLog({...newLog, issues: e.target.value})} 
                placeholder="Weather, shortage, etc."
              />
           </div>
           
           <div className="modal-actions">
             <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
             <button type="submit" className="btn-primary">Save Report</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};

export default Logs;
