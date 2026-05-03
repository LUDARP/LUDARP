import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';

const Updates = () => {
  const { user, canAccess } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [updates, setUpdates] = useState([]);
  const [stages, setStages] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isAllSelectedForPost, setIsAllSelectedForPost] = useState(false);
  
  const [filterTag, setFilterTag] = useState('');
  
  const [newUpdate, setNewUpdate] = useState({ project_id: '', stage_name: '', description: '', image_url: '', image_after_url: '', tags: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    let projs = adminApi.getProjects();
    if(user.role !== 'admin') projs = projs.filter(p => user.project_ids.includes(p.project_id));
    setProjects(projs);
  }, [user]);

  useEffect(() => {
    fetchUpdates();
  }, [selectedProjectId, user, filterTag]);

  const fetchUpdates = () => {
    let list = adminApi.getUpdates(selectedProjectId);
    
    // Security: Filter list by user project access if 'all' is selected
    if (selectedProjectId === 'all' && user.role !== 'admin') {
      list = list.filter(u => user.project_ids.includes(u.project_id));
    }

    if (filterTag) {
      list = list.filter(u => u.tags && u.tags.toLowerCase().includes(filterTag.toLowerCase()));
    }
    
    const enrichedList = list.map(u => {
       const author = adminApi.getUsers().find(us => us.user_id === u.added_by);
       const p = adminApi.getProjectById(u.project_id);
       return { ...u, authorName: author ? author.name : u.added_by, projectName: p ? p.project_name : u.project_id };
    });
    setUpdates(enrichedList);
  };

  const handleOpenModal = () => {
    setEditingItem(null);
    if (selectedProjectId === 'all' && projects.length > 0) {
      setNewUpdate({ project_id: projects[0].project_id, stage_name: '', description: '', image_url: '', image_after_url: '', tags: '', date: new Date().toISOString().split('T')[0] });
      setIsAllSelectedForPost(true);
      fetchStagesForModal(projects[0].project_id);
    } else {
      setNewUpdate({ project_id: selectedProjectId, stage_name: '', description: '', image_url: '', image_after_url: '', tags: '', date: new Date().toISOString().split('T')[0] });
      setIsAllSelectedForPost(false);
      fetchStagesForModal(selectedProjectId);
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setNewUpdate({ ...item });
    fetchStagesForModal(item.project_id);
    setIsModalOpen(true);
  };

  const fetchStagesForModal = (pid) => {
    if (!pid || pid === 'all') return;
    const stg = adminApi.getStages(pid).stages;
    setStages(stg);
  };

  const handleProjectChangeInModal = (pid) => {
    setNewUpdate(prev => ({ ...prev, project_id: pid }));
    fetchStagesForModal(pid);
  };

  const handleSaveUpdate = (e) => {
    e.preventDefault();
    
    if (editingItem) {
      adminApi.updateUpdate(editingItem.id, newUpdate);
      window.showToast('Update modified successfully');
    } else {
      adminApi.addUpdate(newUpdate.project_id, {
        stage_name: newUpdate.stage_name,
        description: newUpdate.description,
        image_url: newUpdate.image_url,
        image_after_url: newUpdate.image_after_url,
        tags: newUpdate.tags,
        date: newUpdate.date,
        added_by: user.user_id
      });
      window.showToast('Site update posted successfully');
    }
    
    fetchUpdates();
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    adminApi.deleteUpdate(id);
    fetchUpdates();
    window.showToast('Update removed');
  };

  const columns = [
    { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString('en-GB') },
    { key: 'projectName', label: 'Project' },
    { key: 'tags', label: 'Tags', render: (row) => row.tags ? <span style={{fontSize:'12px', color:'var(--accent)'}}>{row.tags}</span> : '-' },
    { key: 'description', label: 'Description', render: (row) => row.description.substring(0, 50) + (row.description.length > 50 ? '...' : '') },
    { key: 'image_url', label: 'Visual', render: (row) => row.image_url ? <img src={row.image_url} alt="thumbnail" style={{ height: '30px', width: '40px', objectFit: 'cover', borderRadius: '4px' }} /> : <span style={{color: 'var(--text-muted)'}}>None</span> },
    { key: 'authorName', label: 'Posted By' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Structured Documentation</h1>
          <p className="page-subtitle">Post daily observations, tag items, and track Before/After progress.</p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
           <div>
             <div className="form-label" style={{ marginBottom: '4px', textAlign: 'left' }}>Search Tags</div>
             <input type="text" className="form-input" style={{ width: '150px' }} placeholder="#foundation" value={filterTag} onChange={e => setFilterTag(e.target.value)} />
           </div>
           {projects.length > 1 && (
             <div>
               <div className="form-label" style={{ marginBottom: '4px', textAlign: 'left' }}>Filter by Project</div>
               <select className="form-select" style={{ width: '200px' }} value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                 <option value="all">All Projects</option>
                 {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
               </select>
             </div>
           )}
           {canAccess('updates') && <button className="btn-primary" style={{ padding: '10px 20px', height: '41px' }} onClick={handleOpenModal}>+ Post Update</button>}
        </div>
      </div>

      <DataTable columns={columns} data={updates} onDelete={handleDelete} onEdit={handleOpenEdit} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Edit Site Update' : 'Post Structured Update'}>
        <form onSubmit={handleSaveUpdate}>
           <FormInput 
             label="Project" 
             type="select" 
             value={newUpdate.project_id} 
             onChange={e => handleProjectChangeInModal(e.target.value)} 
             options={projects.map(p => ({value: p.project_id, label: p.project_name}))} 
             required 
             disabled={!!editingItem}
           />
           <FormInput 
             label="Related Stage" 
             type="select" 
             value={newUpdate.stage_name} 
             onChange={e => setNewUpdate({...newUpdate, stage_name: e.target.value})} 
             options={stages.map(s => s.stage_name)} 
             required 
           />
           <FormInput 
             label="Date" 
             type="date" 
             value={newUpdate.date} 
             onChange={e => setNewUpdate({...newUpdate, date: e.target.value})} 
             required 
           />
           <FormInput 
             label="Tags (Comma separated, e.g. #slab, #inspection)" 
             type="text" 
             value={newUpdate.tags || ''} 
             onChange={e => setNewUpdate({...newUpdate, tags: e.target.value})} 
           />
           <FormInput 
             label="Update Notes" 
             type="textarea" 
             value={newUpdate.description} 
             onChange={e => setNewUpdate({...newUpdate, description: e.target.value})} 
             required 
           />
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <FormInput 
               label="Before Image URL (or single)" 
               type="text" 
               placeholder="https://..."
               value={newUpdate.image_url || ''} 
               onChange={e => setNewUpdate({...newUpdate, image_url: e.target.value})} 
             />
             <FormInput 
               label="After Image URL (Optional)" 
               type="text" 
               placeholder="https://..."
               value={newUpdate.image_after_url || ''} 
               onChange={e => setNewUpdate({...newUpdate, image_after_url: e.target.value})} 
             />
           </div>
           <div className="modal-actions">
             <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
             <button type="submit" className="btn-primary">{editingItem ? 'Update Post' : 'Publish Update'}</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};

export default Updates;
