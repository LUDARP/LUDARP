import React from 'react';

const StatCard = ({ icon, label, value, color = "primary", trend }) => {
  return (
    <div className={`stat-card color-${color}`}>
      <div className="stat-header">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      {trend && <div className="stat-trend">{trend}</div>}
    </div>
  );
};

export default StatCard;
