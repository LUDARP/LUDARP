import React from 'react';

const ProgressBar = ({ value, color = "var(--accent)" }) => {
  const percentage = Math.min(100, Math.max(0, Number(value)));

  return (
    <div className="progress-outer">
      <div 
        className="progress-inner" 
        style={{ width: `${percentage}%`, backgroundColor: color }}
      >
        {percentage > 5 ? `${percentage.toFixed(0)}%` : ''}
      </div>
    </div>
  );
};

export default ProgressBar;
