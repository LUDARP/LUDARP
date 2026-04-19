import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

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
    // Navigating to detail page since we have a dedicated ProjectDetail page
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
          <button className="btn-primary" onClick={() => window.showToast('Project creation requires full modal setup. TBD in extended roadmap.', 'info')}>+ Add Project</button>
        )}
      </div>

      <DataTable 
        columns={columns} 
        data={projects} 
        onEdit={handleEdit} 
        onDelete={user.role === 'admin' ? handleDelete : undefined} 
      />
    </div>
  );
};

export default Projects;
