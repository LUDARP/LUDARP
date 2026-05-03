import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';

const ELEMENT_TYPES = ['Foundation','Column','Beam','Slab','Wall','Roof','Window','Door','Staircase','MEP Duct','Plumbing','Electrical Panel'];
const LINK_TYPES = ['stage','cost','task'];

const BIMViewer = () => {
  const { user, canAccess } = useAuth();
  const [models, setModels] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedEl, setSelectedEl] = useState(null);
  const [filterProject, setFilterProject] = useState('all');
  const [isModelModal, setIsModelModal] = useState(false);
  const [isElModal, setIsElModal] = useState(false);
  const [editingEl, setEditingEl] = useState(null);
  const [stages, setStages] = useState([]);
  const [costs, setCosts] = useState([]);
  const [tasks, setTasks] = useState([]);

  const initialModelForm = { project_id: '', model_name: '', model_type: 'Sketchfab', embed_url: '', description: '', discipline: 'Architecture' };
  const [modelForm, setModelForm] = useState(initialModelForm);
  const initialElForm = { name: '', type: 'Column', floor: 'Ground Floor', status: 'planned', link_type: '', link_id: '', notes: '' };
  const [elForm, setElForm] = useState(initialElForm);

  useEffect(() => {
    let projs = adminApi.getProjects();
    if (user.role !== 'admin') projs = projs.filter(p => user.project_ids?.includes(p.project_id));
    setProjects(projs);
  }, [user]);

  useEffect(() => { fetchData(); }, [filterProject]);

  const fetchData = () => {
    const pId = filterProject;
    const list = adminApi.getBIMModels(pId).map(m => {
      const proj = adminApi.getProjects().find(p => p.project_id === m.project_id);
      return { ...m, projectName: proj?.project_name || m.project_id };
    });
    setModels(list);
    if (selectedModel) {
      const refreshed = list.find(m => m.id === selectedModel.id);
      if (refreshed) setSelectedModel(refreshed);
    }
  };

  const loadLinkedData = (projectId) => {
    setStages(adminApi.getStages(projectId).stages || []);
    setCosts(adminApi.getCosts(projectId));
    setTasks(adminApi.getTasks(projectId));
  };

  const handleAddModel = (e) => {
    e.preventDefault();
    adminApi.addBIMModel({ ...modelForm, added_by: user.user_id });
    window.showToast('BIM model linked');
    fetchData();
    setIsModelModal(false);
  };

  const handleDeleteModel = (id) => {
    if (window.confirm('Remove this model?')) { adminApi.deleteBIMModel(id); fetchData(); if(selectedModel?.id === id) setSelectedModel(null); }
  };

  const handleSelectModel = (m) => {
    setSelectedModel(m); setSelectedEl(null);
    loadLinkedData(m.project_id);
  };

  const handleAddEl = (e) => {
    e.preventDefault();
    if (editingEl) { 
      adminApi.updateBIMElement(selectedModel.id, editingEl.id, elForm); 
      if (elForm.status === 'completed' && elForm.link_type === 'stage') {
        window.showToast('Stage progress synchronized with BIM', 'info');
      } else {
        window.showToast('Element updated');
      }
    }
    else { 
      adminApi.addBIMElement(selectedModel.id, elForm); 
      window.showToast('Element added'); 
    }
    fetchData(); setIsElModal(false); setEditingEl(null);
  };

  const handleDeleteEl = (elId) => {
    adminApi.deleteBIMElement(selectedModel.id, elId);
    fetchData();
    if (selectedEl?.id === elId) setSelectedEl(null);
  };

  const statusColor = { planned: '#94a3b8', 'in-progress': '#f59e0b', completed: '#22c55e', blocked: '#ef4444' };

  const totalElements = selectedModel?.elements?.length || 0;
  const doneEl = selectedModel?.elements?.filter(e => e.status === 'completed').length || 0;
  const linkedEl = selectedModel?.elements?.filter(e => e.link_id).length || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🧱 BIM Integration Layer</h1>
          <p className="page-subtitle">Link 3D models to construction stages, costs, and tasks. Your USP vs competitors.</p>
        </div>
        {canAccess('edit') && <button className="btn-primary" onClick={() => { setModelForm({...initialModelForm, project_id: projects[0]?.project_id || ''}); setIsModelModal(true); }}>+ Link Model</button>}
      </div>

      {/* Filter */}
      {user.role === 'admin' && (
        <div style={{ marginBottom: '20px' }}>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="form-input" style={{ width: '260px' }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedModel ? '300px 1fr' : '1fr', gap: '24px' }}>

        {/* Model List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {models.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧱</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No models linked yet.<br/>Paste a Sketchfab or Autodesk Viewer URL to get started.</div>
            </div>
          ) : models.map(m => (
            <div key={m.id} onClick={() => handleSelectModel(m)} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: `2px solid ${selectedModel?.id === m.id ? 'var(--accent)' : 'var(--border)'}`, padding: '16px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{m.model_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{m.projectName} · {m.discipline}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Badge label={m.model_type} variant="info" />
                  {canAccess('delete') && <button className="action-btn delete" onClick={e => { e.stopPropagation(); handleDeleteModel(m.id); }}>🗑️</button>}
                </div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                📐 {(m.elements || []).length} elements · Added {new Date(m.created_at).toLocaleDateString('en-GB')}
              </div>
            </div>
          ))}
        </div>

        {/* Model Detail Panel */}
        {selectedModel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 3D Viewer */}
            {selectedModel.embed_url && (
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🏗️ {selectedModel.model_name} — {selectedModel.model_type} Viewer</span>
                  <a href={selectedModel.embed_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>Open Full ↗</a>
                </div>
                <iframe
                  src={selectedModel.embed_url}
                  style={{ width: '100%', height: '420px', border: 'none', display: 'block' }}
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  title={selectedModel.model_name}
                />
              </div>
            )}

            {/* Element Stats */}
            <div className="stat-grid">
              <StatCard icon="🔩" label="Total Elements" value={totalElements} />
              <StatCard icon="✅" label="Completed" value={doneEl} color="success" />
              <StatCard icon="🔗" label="Linked to Data" value={linkedEl} color="primary" />
              <StatCard icon="📈" label="Completion" value={totalElements ? `${Math.round((doneEl/totalElements)*100)}%` : '0%'} color={doneEl === totalElements && totalElements > 0 ? 'success' : 'warning'} />
            </div>

            {/* Elements Table */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Model Elements — Linked Intelligence</span>
                {canAccess('edit') && <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => { setEditingEl(null); setElForm(initialElForm); setIsElModal(true); }}>+ Add Element</button>}
              </div>

              {(selectedModel.elements || []).length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔩</div>
                  <div>No elements yet. Add building elements and link them to costs, stages, and tasks.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        {['Element','Type','Floor','Status','Linked To','Notes',''].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedModel.elements || []).map(el => (
                        <tr key={el.id} onClick={() => setSelectedEl(el === selectedEl ? null : el)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selectedEl?.id === el.id ? '#f0f6ff' : 'transparent', transition: 'background 0.15s' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 600 }}>{el.name}</td>
                          <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{el.type}</td>
                          <td style={{ padding: '10px 16px' }}>{el.floor}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: statusColor[el.status] + '22', color: statusColor[el.status], fontWeight: 700, fontSize: '11px' }}>{el.status}</span>
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            {el.link_type && el.link_id ? <Badge label={`${el.link_type}: ${el.link_id.slice(-6)}`} variant="info" /> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 16px', color: 'var(--text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.notes || '—'}</td>
                          <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                            {canAccess('edit') && <button className="action-btn" onClick={e => { e.stopPropagation(); setEditingEl(el); setElForm({...el}); setIsElModal(true); }}>✏️</button>}
                            {canAccess('delete') && <button className="action-btn delete" onClick={e => { e.stopPropagation(); handleDeleteEl(el.id); }}>🗑️</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Model Modal */}
      <Modal isOpen={isModelModal} onClose={() => setIsModelModal(false)} title="Link BIM Model">
        <form onSubmit={handleAddModel}>
          <FormInput label="Project" type="select" value={modelForm.project_id} onChange={e => setModelForm({...modelForm, project_id: e.target.value})} options={projects.map(p => ({value: p.project_id, label: p.project_name}))} required />
          <FormInput label="Model Name" type="text" value={modelForm.model_name} onChange={e => setModelForm({...modelForm, model_name: e.target.value})} placeholder="e.g. Structural Model v2" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormInput label="Model Type" type="select" value={modelForm.model_type} onChange={e => setModelForm({...modelForm, model_type: e.target.value})} options={['Sketchfab','Autodesk Viewer','Google Poly','glTF URL','Other']} />
            <FormInput label="Discipline" type="select" value={modelForm.discipline} onChange={e => setModelForm({...modelForm, discipline: e.target.value})} options={['Architecture','Structure','MEP','Civil','Interior','Full BIM']} />
          </div>
          <FormInput label="Embed / Viewer URL" type="text" value={modelForm.embed_url} onChange={e => setModelForm({...modelForm, embed_url: e.target.value})} placeholder="https://sketchfab.com/models/.../embed" required />
          <FormInput label="Description" type="textarea" value={modelForm.description} onChange={e => setModelForm({...modelForm, description: e.target.value})} />
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#0369a1', marginBottom: '16px' }}>
            💡 <strong>Tip:</strong> On Sketchfab, click Share → Embed to get the embed URL. For Autodesk Viewer, use your Forge-hosted viewer URL.
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModelModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Link Model</button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Element Modal */}
      <Modal isOpen={isElModal} onClose={() => setIsElModal(false)} title={editingEl ? 'Edit Element' : 'Add Model Element'}>
        <form onSubmit={handleAddEl}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormInput label="Element Name" type="text" value={elForm.name} onChange={e => setElForm({...elForm, name: e.target.value})} placeholder="e.g. Col-G1" required />
            <FormInput label="Element Type" type="select" value={elForm.type} onChange={e => setElForm({...elForm, type: e.target.value})} options={ELEMENT_TYPES} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormInput label="Floor / Level" type="text" value={elForm.floor} onChange={e => setElForm({...elForm, floor: e.target.value})} placeholder="Ground Floor" />
            <FormInput label="Status" type="select" value={elForm.status} onChange={e => setElForm({...elForm, status: e.target.value})} options={['planned','in-progress','completed','blocked']} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormInput label="Link Type" type="select" value={elForm.link_type} onChange={e => setElForm({...elForm, link_type: e.target.value, link_id: ''})} options={['', ...LINK_TYPES]} />
            {elForm.link_type === 'stage' && <FormInput label="Stage" type="select" value={elForm.link_id} onChange={e => setElForm({...elForm, link_id: e.target.value})} options={stages.map(s => ({value: s.stage_name, label: s.stage_name}))} />}
            {elForm.link_type === 'cost' && <FormInput label="Cost Entry ID" type="text" value={elForm.link_id} onChange={e => setElForm({...elForm, link_id: e.target.value})} placeholder="c1, c2..." />}
            {elForm.link_type === 'task' && <FormInput label="Task ID" type="text" value={elForm.link_id} onChange={e => setElForm({...elForm, link_id: e.target.value})} placeholder="task_..." />}
            {!elForm.link_type && <div />}
          </div>
          <FormInput label="Notes" type="textarea" value={elForm.notes} onChange={e => setElForm({...elForm, notes: e.target.value})} />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsElModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editingEl ? 'Update Element' : 'Add Element'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BIMViewer;
