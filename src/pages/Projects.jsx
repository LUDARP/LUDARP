import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ 
    project_name: '', 
    client_name: '', 
    location: '', 
    total_budget: '', 
    start_date: new Date().toISOString().split('T')[0], 
    end_date: '', 
    description: '',
    client_password: 'password123'
  });

  const fetchProjects = () => {
    let projs = adminApi.getProjects();
    if (user.role !== 'admin') {
      projs = projs.filter(p => user.project_ids.includes(p.project_id));
    }
    
    // Attach computed stats
    const enriched = projs.map(p => {
       const stats = adminApi.getStages(p.project_id);
       const costs = adminApi.getCostSummary(p.project_id);
       return { ...p, overallProgress: stats.overallProgress, health: costs.health };
    });
    setProjects(enriched);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleAddProject = (e) => {
    e.preventDefault();
    const created = adminApi.addProject({
      ...newProject,
      total_budget: Number(newProject.total_budget)
    });
    
    fetchProjects();
    setIsModalOpen(false);
    window.showToast(`Project ${created.project_name} initialized with standard stages`);
  };

  const columns = [
    { key: 'project_id', label: 'ID', render: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.project_id}</span> },
    { key: 'project_name', label: 'Project Name', render: (row) => <strong style={{color: 'var(--accent)'}}>{row.project_name}</strong> },
    { key: 'client_name', label: 'Client' },
    { key: 'current_stage', label: 'Stage' },
    { key: 'overallProgress', label: 'Progress', render: (row) => (
      <div style={{ width: '100px' }}>
         <div style={{ fontSize: '11px', marginBottom: '4px' }}>{row.overallProgress.toFixed(0)}%</div>
         <div className="progress-outer"><div className="progress-inner" style={{ width: `${row.overallProgress}%` }}></div></div>
      </div>
    )},
    { key: 'health', label: 'Health', render: (row) => <Badge variant={row.health} label={row.health} /> },
    { key: 'status', label: 'Status', render: (row) => <Badge variant={row.status === 'active' ? 'success' : 'gray'} label={row.status} /> }
  ];

  const handleEdit = (p) => {
    navigate(`/projects/${p.project_id}`);
  };

  const handleDelete = (id) => {
    adminApi.deleteProject(id);
    fetchProjects();
    window.showToast('Project deleted successfully');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects Directory</h1>
          <p className="page-subtitle">Manage construction sites and timelines.</p>
        </div>
        {user.role === 'admin' && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Project</button>
        )}
      </div>

      <DataTable 
        columns={columns} 
        data={projects} 
        onEdit={handleEdit} 
        onDelete={user.role === 'admin' ? handleDelete : undefined} 
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initialize New Project">
        <form onSubmit={handleAddProject}>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormInput label="Project Name" type="text" value={newProject.project_name} onChange={e => setNewProject({...newProject, project_name: e.target.value})} required />
              <FormInput label="Client Name" type="text" value={newProject.client_name} onChange={e => setNewProject({...newProject, client_name: e.target.value})} required />
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <FormInput label="Location" type="text" value={newProject.location} onChange={e => setNewProject({...newProject, location: e.target.value})} required />
             <FormInput label="Total Budget (₹)" type="number" value={newProject.total_budget} onChange={e => setNewProject({...newProject, total_budget: e.target.value})} required />
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <FormInput label="Start Date" type="date" value={newProject.start_date} onChange={e => setNewProject({...newProject, start_date: e.target.value})} required />
             <FormInput label="Est. End Date" type="date" value={newProject.end_date} onChange={e => setNewProject({...newProject, end_date: e.target.value})} required />
           </div>

           <FormInput label="Client Portal Password" type="text" value={newProject.client_password} onChange={e => setNewProject({...newProject, client_password: e.target.value})} required />
           
           <FormInput label="Project Description" type="textarea" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} required />

           <div className="modal-actions">
             <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
             <button type="submit" className="btn-primary">Create Project</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
