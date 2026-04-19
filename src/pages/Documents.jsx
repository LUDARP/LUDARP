import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';

const Documents = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [documents, setDocuments] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ project_id: '', document_name: '', category: 'Drawing', file_url: '' });

  useEffect(() => {
    let projs = adminApi.getProjects();
    if(user.role !== 'admin') projs = projs.filter(p => user.project_ids.includes(p.project_id));
    setProjects(projs);
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [selectedProjectId, user]);

  const fetchDocuments = () => {
    let list = adminApi.getDocuments(selectedProjectId);

    if (selectedProjectId === 'all' && user.role !== 'admin') {
      list = list.filter(d => user.project_ids.includes(d.project_id));
    }

    const enrichedList = list.map(d => {
       const author = adminApi.getUsers().find(us => us.user_id === d.uploaded_by);
       const p = adminApi.getProjectById(d.project_id);
       return { ...d, authorName: author ? author.name : d.uploaded_by, projectName: p ? p.project_name : d.project_id };
    });
    setDocuments(enrichedList);
  };

  const handleOpenModal = () => {
    if (selectedProjectId === 'all' && projects.length > 0) {
      setNewDoc(prev => ({ ...prev, project_id: projects[0].project_id }));
    } else {
      setNewDoc(prev => ({ ...prev, project_id: selectedProjectId }));
    }
    setIsModalOpen(true);
  };

  const handleAddDoc = (e) => {
    e.preventDefault();
    adminApi.addDocument(newDoc.project_id, {
      document_name: newDoc.document_name,
      category: newDoc.category,
      file_url: newDoc.file_url,
      uploaded_by: user.user_id
    });
    
    fetchDocuments();
    setIsModalOpen(false);
    setNewDoc({ ...newDoc, document_name: '', file_url: '' });
    window.showToast('Document uploaded successfully');
  };

  const handleDelete = (id) => {
    adminApi.deleteDocument(id);
    fetchDocuments();
    window.showToast('Document removed');
  };

  const columns = [
    { key: 'document_name', label: 'Document Name', render: (row) => <strong style={{color:'var(--accent)'}}>{row.document_name}</strong> },
    { key: 'category', label: 'Category', render: (row) => <Badge variant="gray" label={row.category} /> },
    { key: 'projectName', label: 'Project' },
    { key: 'uploaded_date', label: 'Date', render: (row) => new Date(row.uploaded_date).toLocaleDateString('en-GB') },
    { key: 'authorName', label: 'Uploaded By' },
    { key: 'file_url', label: 'Link', render: (row) => <a href={row.file_url} target="_blank" rel="noreferrer" style={{color: 'var(--accent)', textDecoration: 'underline'}}>View file</a> }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Documents</h1>
          <p className="page-subtitle">Manage drawings, reports, and approvals.</p>
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
           {canAccess('edit') && <button className="btn-primary" style={{ padding: '10px 20px', height: '41px' }} onClick={handleOpenModal}>+ Add Document</button>}
        </div>
      </div>

      <DataTable columns={columns} data={documents} onDelete={handleDelete} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Document">
        <form onSubmit={handleAddDoc}>
           <FormInput 
             label="Project" 
             type="select" 
             value={newDoc.project_id} 
             onChange={e => setNewDoc({...newDoc, project_id: e.target.value})} 
             options={projects.map(p => ({value: p.project_id, label: p.project_name}))} 
             required 
           />
           <FormInput 
             label="Document Name" 
             type="text" 
             value={newDoc.document_name} 
             onChange={e => setNewDoc({...newDoc, document_name: e.target.value})} 
             required 
           />
           <FormInput 
             label="Category" 
             type="select" 
             value={newDoc.category} 
             onChange={e => setNewDoc({...newDoc, category: e.target.value})} 
             options={['Drawing', 'Report', 'Approval', 'Contract', 'Other']} 
             required 
           />
           <FormInput 
             label="File URL" 
             type="text" 
             placeholder="https://..."
             value={newDoc.file_url} 
             onChange={e => setNewDoc({...newDoc, file_url: e.target.value})} 
             required
           />
           <div className="modal-actions">
             <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
             <button type="submit" className="btn-primary">Save Document</button>
           </div>
        </form>
      </Modal>
    </div>
  );
};

export default Documents;
