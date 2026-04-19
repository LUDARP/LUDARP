import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';

const Progress = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const [stages, setStages] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStage, setEditStage] = useState(null);

  useEffect(() => {
    let projs = adminApi.getProjects();
    if(user.role !== 'admin') projs = projs.filter(p => user.project_ids.includes(p.project_id));
    setProjects(projs);
    if(projs.length > 0) setSelectedProjectId(projs[0].project_id);
  }, [user]);

  useEffect(() => {
    if(!selectedProjectId) return;
    fetchStages(selectedProjectId);
  }, [selectedProjectId]);

  const fetchStages = (pid) => {
    const res = adminApi.getStages(pid);
    setStages(res.stages);
    setOverallProgress(res.overallProgress);
  };

  const handleEditClick = (stage) => {
    setEditStage({ ...stage });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if(editStage.completion_percentage < 0 || editStage.completion_percentage > 100) return;
    
    adminApi.updateStage(selectedProjectId, editStage.stage_name, {
      completion_percentage: editStage.completion_percentage,
      notes: editStage.notes
    });

    fetchStages(selectedProjectId);
    setIsModalOpen(false);
    window.showToast(`Updated ${editStage.stage_name} to ${editStage.completion_percentage}%`);
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title">Progress Tracking</h1>
          <p className="page-subtitle">Update stage completion to recalculate overall trajectory.</p>
        </div>
        {projects.length > 1 && (
          <div style={{ textAlign: 'right' }}>
             <div className="form-label" style={{ marginBottom: '4px' }}>Select Project</div>
             <select className="form-select" style={{ width: '250px' }} value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
               {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name} ({p.project_id})</option>)}
             </select>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--accent)', color: 'white', padding: '24px', borderRadius: 'var(--radius)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
           <div style={{ textTransform: 'uppercase', fontSize: '13px', fontWeight: 600, letterSpacing: '1px', opacity: 0.9 }}>Overall Project Progress</div>
           <div style={{ fontSize: '36px', fontWeight: 800, margin: '4px 0' }}>{overallProgress.toFixed(1)}%</div>
         </div>
         <div style={{ width: '50%' }}>
           <div className="progress-outer" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="progress-inner" style={{ width: `${overallProgress}%`, background: 'white' }}></div>
           </div>
         </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Stage Name</th>
              <th>Weight</th>
              <th style={{ width: '30%' }}>Progress</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s, idx) => {
              let stat = 'Not Started'; let v = 'gray';
              if(s.completion_percentage === 100) { stat = 'Complete'; v = 'success'; }
              else if(s.completion_percentage > 0) { stat = 'In Progress'; v = 'accent'; }

              return (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.stage_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.notes || ''}</div>
                  </td>
                  <td>{s.weight}%</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, width: '35px' }}>{s.completion_percentage}%</span>
                      <div className="progress-outer"><div className="progress-inner" style={{width:`${s.completion_percentage}%`}}></div></div>
                    </div>
                  </td>
                  <td><Badge variant={v} label={stat} /></td>
                  <td>
                    {canAccess('edit') && <button className="btn-secondary" style={{ padding: '6px 12px' }} onClick={() => handleEditClick(s)}>Update</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Update: ${editStage?.stage_name}`}>
        {editStage && (
          <form onSubmit={handleSave}>
             <FormInput 
               label="Completion % (0-100)" 
               type="number" 
               value={editStage.completion_percentage} 
               onChange={e => setEditStage({...editStage, completion_percentage: e.target.value})} 
               required
             />
             <div style={{ marginBottom: '16px' }}>
               <input type="range" className="slider" min="0" max="100" value={editStage.completion_percentage} onChange={e => setEditStage({...editStage, completion_percentage: e.target.value})} />
             </div>
             <FormInput 
               label="Stage Notes / Remarks" 
               type="textarea" 
               value={editStage.notes} 
               onChange={e => setEditStage({...editStage, notes: e.target.value})} 
             />
             <div className="modal-actions">
               <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
               <button type="submit" className="btn-primary" style={{ width: 'auto' }}>Save Progress</button>
             </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Progress;
