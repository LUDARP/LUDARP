import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Loader from '../components/Loader';

const Documents = ({ isAdmin }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocs = () => {
      const projectId = localStorage.getItem('ludarp_project_id');
      const res = api.getDocuments(projectId);
      if (res?.success) {
        setDocs(res.data);
      } else {
        setError('Failed to fetch documents');
      }
      setLoading(false);
    };
    fetchDocs();
  }, []);

  if (loading) return <Loader />;
  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Project Documents</h1>
      </div>

      <div>
        {docs.length > 0 ? (
          docs.map((doc, idx) => (
            <div key={idx} className="document-item">
              <div className="document-name">{doc.document_name}</div>
              <div className="document-actions">
                <a 
                  href={doc.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-sm btn-outline"
                >
                  View
                </a>
                <a 
                  href={doc.file_url} 
                  download 
                  className="btn-sm"
                  style={{ background: 'var(--accent)', color: 'white', border: '1px solid var(--accent)' }}
                >
                  Download
                </a>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">No documents uploaded for this project yet.</p>
        )}
      </div>
    </div>
  );
};

export default Documents;
