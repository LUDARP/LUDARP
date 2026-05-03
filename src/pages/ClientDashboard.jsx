import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/api';
import Loader from '../components/Loader';
import UpdateCard from '../components/UpdateCard';
import ContactCard from '../components/ContactCard';
import PendingItem from '../components/PendingItem';
import { MiniWeather } from '../components/DashboardWidgets';

const ClientShortcuts = () => (
  <div className="client-shortcuts">
    <button className="shortcut-btn" onClick={() => window.showToast('Feature coming soon!', 'info')}><span className="icon">📞</span> Call Architect</button>
    <button className="shortcut-btn" onClick={() => window.showToast('Feature coming soon!', 'info')}><span className="icon">📅</span> Schedule Visit</button>
    <button className="shortcut-btn" onClick={() => window.showToast('Feature coming soon!', 'info')}><span className="icon">💳</span> Pay Milestone</button>
    <button className="shortcut-btn" onClick={() => window.showToast('Feature coming soon!', 'info')}><span className="icon">📑</span> Request Doc</button>
  </div>
);

const ClientDashboard = () => {
  const [data, setData] = useState({ project: null, updates: [], stages: [], overallProgress: 0, spending: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchData = () => {
      const user = adminApi.getCurrentUser();
      const projectId = user?.user_id; // For clients, user_id IS the project_id
      
      const project = adminApi.getProjectById(projectId);
      const updates = adminApi.getUpdates(projectId);
      const stageInfo = adminApi.getStages(projectId);
      const spending = adminApi.getCostSummary(projectId);

      if (project) {
        setData({
          project,
          updates: updates.slice(0, 3),
          stages: stageInfo.stages,
          overallProgress: stageInfo.overallProgress,
          spending
        });
      } else {
        setError('Failed to fetch dashboard data');
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!data.project?.project_images?.length) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % data.project.project_images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [data.project]);

  if (loading) return <Loader />;
  if (error) return <div className="error-msg">{error}</div>;
  if (!data.project) return null;

  const { project, updates, stages, overallProgress, spending } = data;
  
  const totalSpent = spending?.total_spent || 0;
  const totalBudget = project.total_budget;
  const spentPct = (totalSpent / totalBudget) * 100;
  
  // Format Date
  const formatDate = (ds) => new Date(ds).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-section">
        {project.project_images?.map((img, idx) => (
          <div key={idx} className={`hero-slide ${idx === currentSlide ? 'active' : ''}`}>
            <img src={img} alt={`Slide ${idx}`} className="hero-img" />
          </div>
        ))}
        <div className="hero-dots">
          {project.project_images?.map((_, idx) => (
            <div key={idx} className={`hero-dot ${idx === currentSlide ? 'active' : ''}`} />
          ))}
        </div>
        <div className="hero-overlay">
          <div>
            <h1 className="hero-title">{project.project_name}</h1>
            <p className="hero-subtitle">📍 {project.location}</p>
          </div>
          {project.model_3d_url && (
            <a href={project.model_3d_url} target="_blank" rel="noreferrer" className="btn-primary" style={{ width: 'auto', background: 'var(--accent)' }}>
              View 3D Model
            </a>
          )}
        </div>
      </div>
      
      {/* Description */}
      <div className="dashboard-top-grid" style={{ marginTop: '24px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '700' }}>Project Summary</h3>
          <p style={{ fontSize: '15px', color: 'var(--text)', margin: 0, lineHeight: '1.6' }}>
            {project.description}
          </p>
          <div className="ai-note" style={{ marginTop: '20px', padding: '16px', background: 'var(--info-light)', borderRadius: '8px', borderLeft: '4px solid var(--info)' }}>
             <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--info)', marginBottom: '4px' }}>✨ AI Project Insight</div>
             <div style={{ fontSize: '13px', color: 'var(--text)' }}>
               Your project is <strong>ahead of schedule</strong> by 4 days. The {project.current_stage} phase is progressing efficiently. No critical issues reported.
             </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <MiniWeather location={project.location} />
          <ClientShortcuts />
        </div>
      </div>

      {/* Brief Strip */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-title">Start Date</div>
          <div className="stat-value">{formatDate(project.start_date)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">End Date (Est)</div>
          <div className="stat-value">{formatDate(project.end_date)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Current Stage</div>
          <div className="stat-value blue">{project.current_stage || 'Planning'}</div>
        </div>
        <div className="stat-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="stat-title">Overall Progress</div>
            <div className="stat-value">{overallProgress.toFixed(1)}%</div>
          </div>
          
          <div className="circle-progress-wrapper">
             <svg className="circle-progress-svg" width="60" height="60" viewBox="0 0 100 100">
               <circle className="circle-progress-bg" cx="50" cy="50" r="40" />
               <circle className="circle-progress-val" cx="50" cy="50" r="40" 
                       strokeDasharray={`${overallProgress * 2.51} 251.2`} />
             </svg>
          </div>
        </div>
      </div>

      {/* Budget Snapshot */}
      <div style={{ marginBottom: '32px', background: 'var(--surface)', padding: '20px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: '600' }}>Budget Snapshot</span>
          <span className="amount">₹{totalBudget.toLocaleString('en-IN')}</span>
        </div>
        <div className="progress-outer" style={{ height: '14px' }}>
          <div className="progress-inner" style={{ width: `${Math.min(100, spentPct)}%`, background: spentPct > 100 ? 'var(--danger)' : 'var(--accent)' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px' }}>
          <span style={{ color: 'var(--danger)', fontWeight: '600' }}>Spent: ₹{totalSpent.toLocaleString('en-IN')}</span>
          <span style={{ color: 'var(--success)', fontWeight: '600' }}>Remaining: ₹{(totalBudget - totalSpent).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Stage Pipeline */}
      <h3 style={{ fontSize: '18px', paddingBottom: '12px' }}>Project Timeline</h3>
      <div className="pipeline-container">
        {stages.map((stage, idx) => {
          let cStatus = 'not_started';
          if (stage.completion_percentage === 100) cStatus = 'complete';
          else if (stage.completion_percentage > 0) cStatus = 'in_progress';
          
          // Force in_progress if it's the current active stage manually set
          if (project.current_stage === stage.stage_name && cStatus === 'not_started') cStatus = 'in_progress';

          return (
            <Link to="/progress" key={idx} className={`pipeline-chip ${cStatus}`}>
              {cStatus === 'complete' && '✓ '} {stage.stage_name}
            </Link>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px', marginTop: '40px' }}>
        
        {/* Latest Updates */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', margin: 0 }}>Latest Updates</h3>
            <Link to="/updates" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}>See all updates →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {updates.length > 0 ? updates.map((u, i) => <UpdateCard key={i} update={u} />) : <p className="muted">No updates.</p>}
          </div>
        </div>

        {/* Pending & Team */}
        <div>
           {project.pending_items && project.pending_items.length > 0 && (
             <div style={{ marginBottom: '32px' }}>
               <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Action Items</h3>
               <div className="pending-list">
                 {project.pending_items.map(item => <PendingItem key={item.id} item={item} />)}
               </div>
             </div>
           )}

           <div>
             <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Project Team</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {project.contacts?.map((c, i) => <ContactCard key={i} contact={c} />)}
             </div>
           </div>
        </div>
      </div>
      
    </div>
  );
};

export default ClientDashboard;
