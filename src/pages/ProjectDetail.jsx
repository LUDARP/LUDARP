import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import Badge from '../components/Badge';
import { Guard } from '../context/AuthContext';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Extra data for tabs
  const [users, setUsers] = useState([]);
  const [stages, setStages] = useState([]);
  const [costSummary, setCostSummary] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const p = adminApi.getProjectById(projectId);
    if(!p) { navigate('/projects'); return; }
    setProject(p);
    
    setUsers(adminApi.getUsers().filter(u => u.project_ids.includes(projectId)));
    setStages(adminApi.getStages(projectId).stages);
    setCostSummary(adminApi.getCostSummary(projectId));
    setDocuments(adminApi.getDocuments(projectId));
  }, [projectId, navigate]);

  if (!project) return null;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '0', borderBottom: 'none' }}>
        <div>
           <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             <h1 className="page-title">{project.project_name}</h1>
             <Badge variant={project.status === 'active' ? 'success' : 'gray'} label={project.status} />
           </div>
           <p className="page-subtitle" style={{ marginTop: '8px' }}>{project.location} • Client: {project.client_name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px', marginTop: '24px' }}>
        {['overview', 'stages', 'costs', 'documents'].map(tab => (
          <Guard key={tab} feature={tab === 'costs' ? 'costs' : tab === 'documents' ? 'documents' : null}>
            <div 
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: '12px 4px', 
                cursor: 'pointer', 
                fontWeight: 600, 
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '3px solid var(--accent)' : '3px solid transparent',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </div>
          </Guard>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="card-grid-2">
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Project Details</h3>
            <p>{project.description}</p>
            <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
               <div>
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>START DATE</div>
                 <div style={{ fontWeight: 600 }}>{new Date(project.start_date).toLocaleDateString('en-GB')}</div>
               </div>
               <div>
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>EST. END DATE</div>
                 <div style={{ fontWeight: 600 }}>{new Date(project.end_date).toLocaleDateString('en-GB')}</div>
               </div>
            </div>
          </div>
          
          <Guard feature="users">
            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '15px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Assigned Team</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {users.map(u => (
                  <div key={u.user_id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="user-avatar" style={{ background: 'var(--accent)' }}>{u.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{u.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Guard>
        </div>
      )}

      {activeTab === 'stages' && (
        <div className="table-container">
           <table>
             <thead><tr><th>Stage</th><th>Weight</th><th>Progress</th><th>Budget</th><th>Spent</th></tr></thead>
             <tbody>
               {stages.map(s => (
                 <tr key={s.stage_name}>
                   <td style={{ fontWeight: 600 }}>{s.stage_name}</td>
                   <td>{s.weight}%</td>
                   <td>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ fontSize: '12px', width: '30px' }}>{s.completion_percentage}%</span>
                       <div className="progress-outer"><div className="progress-inner" style={{width: `${s.completion_percentage}%`}}></div></div>
                     </div>
                   </td>
                   <td className="amount">₹{Number(s.stage_budget).toLocaleString('en-IN')}</td>
                   <td className="amount">₹{Number(s.stage_spent).toLocaleString('en-IN')}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}

      {activeTab === 'costs' && costSummary && (
        <div>
           <div className="stat-grid" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                 <div className="stat-title">Budget</div>
                 <div className="stat-value amount">₹{costSummary.total_budget.toLocaleString('en-IN')}</div>
              </div>
              <div className="stat-card">
                 <div className="stat-title">Spent</div>
                 <div className="stat-value amount red">₹{costSummary.total_spent.toLocaleString('en-IN')}</div>
              </div>
              <div className="stat-card">
                 <div className="stat-title">Health</div>
                 <div style={{ marginTop: 'auto' }}><Badge variant={costSummary.health} label={costSummary.health} /></div>
              </div>
           </div>
           <p className="muted">To view full logs or add costs, go to the dedicated Costs Page.</p>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="table-container">
          <table>
            <thead><tr><th>Document</th><th>Category</th><th>Upload Date</th></tr></thead>
            <tbody>
              {documents.length > 0 ? documents.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}><a href={d.file_url}>{d.document_name}</a></td>
                  <td><Badge variant="gray" label={d.category} /></td>
                  <td>{new Date(d.uploaded_date).toLocaleDateString('en-GB')}</td>
                </tr>
              )) : <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px' }}>No documents.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default ProjectDetail;
