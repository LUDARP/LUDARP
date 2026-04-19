import React from 'react';
import ProgressBar from './ProgressBar';

const StageCard = ({ stage, isAdmin, onSliderChange }) => {
  const spentPct = (stage.stage_spent / stage.stage_budget) * 100;
  const progPct = stage.completion_percentage;
  
  let statusBadge = "Not Started";
  let badgeClass = "badge-gray";
  let health = null;

  if (progPct === 100) {
    statusBadge = "Complete";
    badgeClass = "badge-success";
  } else if (progPct > 0) {
    statusBadge = "In Progress";
    badgeClass = "badge-accent";
  }

  if (progPct > 0 || spentPct > 0) {
    if (spentPct > progPct + 10) {
      health = <span className="badge badge-danger">Over Budget ⚠️</span>;
    } else {
      health = <span className="badge badge-success">On Track ✅</span>;
    }
  }

  return (
    <div className="stage-card">
      <div className="stage-header">
        <div>
          <div className="stage-title">{stage.stage_name}</div>
          <div className="stage-desc">{stage.description}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className={`badge ${badgeClass}`}>{statusBadge}</span>
          {health}
        </div>
      </div>

      <div className="stage-stats">
        <div>Weight: {stage.weight}%</div>
        <div>Budget: ₹{stage.stage_budget.toLocaleString('en-IN')}</div>
        <div>Spent: ₹{stage.stage_spent.toLocaleString('en-IN')}</div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
          <span>Physical Progress</span>
          <span>{progPct}%</span>
        </div>
        <ProgressBar value={progPct} />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: 'var(--muted)' }}>
          <span>Financial Progress ({spentPct.toFixed(0)}%)</span>
          <span>Remaining: ₹{(stage.stage_budget - stage.stage_spent).toLocaleString('en-IN')}</span>
        </div>
        <div className="budget-bar">
          <div className="budget-spent" style={{ width: `${Math.min(100, spentPct)}%`, backgroundColor: spentPct > 100 ? 'var(--danger)' : 'var(--accent)' }}></div>
        </div>
      </div>

      {isAdmin && (
        <div className="slider-container" style={{ marginTop: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Update Progress: {progPct}%</div>
          <input 
            type="range" min="0" max="100" 
            className="slider"
            value={progPct}
            onChange={(e) => onSliderChange(stage.stage_name, e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default StageCard;
