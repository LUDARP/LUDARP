import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Loader from '../components/Loader';
import ProgressBar from '../components/ProgressBar';
import UpdateCard from '../components/UpdateCard';

const Dashboard = () => {
  const [data, setData] = useState({ project: null, updates: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = () => {
      const projectId = localStorage.getItem('ludarp_project_id');
      const projectRes = api.getProject(projectId);
      const updatesRes = api.getUpdates(projectId);

      if (projectRes?.success && updatesRes?.success) {
        setData({
          project: projectRes.data,
          updates: updatesRes.data.slice(0, 3)
        });
      } else {
        setError(projectRes?.error || 'Failed to fetch data');
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <Loader />;
  if (error) return <div className="page-content"><div className="error-msg">{error}</div></div>;
  if (!data.project) return null;

  const { project, updates } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.project_name}</h1>
          <p className="page-subtitle">{project.location}</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-title">Start Date</div>
          <div className="stat-value">{new Date(project.start_date).toLocaleDateString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">End Date</div>
          <div className="stat-value">{new Date(project.end_date).toLocaleDateString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Current Stage</div>
          <div className="stat-value">{project.stage}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Budget</div>
          <div className="stat-value">₹{Number(project.total_budget).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3>Overall Progress</h3>
        <ProgressBar value={project.progress || 0} />
      </div>

      <div className="recent-updates">
        <h3>Recent Updates</h3>
        {updates.length > 0 ? (
          updates.map((upd, idx) => (
            <UpdateCard key={idx} update={upd} />
          ))
        ) : (
          <p className="muted">No recent updates.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
