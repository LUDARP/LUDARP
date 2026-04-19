import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Loader from '../components/Loader';
import ProgressBar from '../components/ProgressBar';

const Progress = ({ isAdmin }) => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStages = () => {
    const projectId = localStorage.getItem('ludarp_project_id');
    const res = api.getStages(projectId);
    if (res?.success) {
      setStages(res.data);
    } else {
      setError('Failed to fetch stages');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStages();
  }, []);

  const handleSliderChange = (stageName, newValue) => {
    const projectId = localStorage.getItem('ludarp_project_id');
    api.updateStage(projectId, stageName, newValue);
    
    // Recalculate overall progress
    const res = api.getStages(projectId);
    if(res?.success) {
       const newStages = res.data;
       const avg = newStages.reduce((acc, curr) => acc + Number(curr.completion_percentage), 0) / newStages.length;
       api.updateProjectProgress(projectId, avg);
    }
    fetchStages();
  };

  if (loading) return <Loader />;
  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Detailed Progress</h1>
      </div>

      <div className="stat-grid" style={{ display: 'block' }}>
        {stages.length > 0 ? (
          stages.map((stage, idx) => (
            <div key={idx} className="stat-card" style={{ marginBottom: '16px' }}>
              <div className="stat-title" style={{ marginBottom: '8px', color: '#1C2833', display: 'flex', justifyContent: 'space-between' }}>
                <span>{stage.stage_name}</span>
                <span>{stage.completion_percentage}%</span>
              </div>
              <ProgressBar value={stage.completion_percentage} />
              
              {isAdmin && (
                <div className="slider-container">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    className="slider"
                    value={stage.completion_percentage}
                    onChange={(e) => handleSliderChange(stage.stage_name, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))
        ) : (
           <p className="muted">No stage data available.</p>
        )}
      </div>
    </div>
  );
};

export default Progress;
