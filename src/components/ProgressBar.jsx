import React from 'react';

const ProgressBar = ({ value }) => {
  const percentage = Math.min(100, Math.max(0, Number(value)));

  return (
    <div className="progress-outer">
      <div 
        className="progress-inner" 
        style={{ width: `${percentage}%` }}
      >
        {percentage > 5 ? `${percentage}%` : ''}
      </div>
    </div>
  );
};

export default ProgressBar;
