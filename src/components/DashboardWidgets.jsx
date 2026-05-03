import React from 'react';
import Badge from './Badge';

export const AIInsight = ({ projectCount, riskCount, totalSpent, totalBudget }) => {
  const health = riskCount === 0 ? 'Excellent' : riskCount < projectCount / 2 ? 'Stable' : 'Critical';
  const utilization = ((totalSpent / totalBudget) * 100).toFixed(1);
  
  return (
    <div className="smart-insight-card">
      <div className="insight-header">
        <span className="insight-icon">✨</span>
        <span className="insight-label">LUDARP AI Insight</span>
        <Badge label={health} variant={health.toLowerCase()} />
      </div>
      <div className="insight-body">
        <p>
          Currently, <strong>{projectCount} projects</strong> are active with a budget utilization of <strong>{utilization}%</strong>. 
          {riskCount > 0 ? (
            <span className="text-warning"> Caution: {riskCount} projects are approaching budget limits. Consider auditing material procurement.</span>
          ) : (
            <span className="text-success"> All projects are running efficiently within scheduled margins.</span>
          )}
        </p>
      </div>
      <div className="insight-footer">
        <div className="discovery-tag">Opportunity: Substructure costs are 12% lower this month.</div>
      </div>
    </div>
  );
};

export const MiniWeather = ({ location }) => {
  // Mock weather data
  const weather = {
    temp: 31,
    condition: 'Sunny',
    humidity: '65%',
    wind: '12 km/h',
    icon: '☀️'
  };

  return (
    <div className="weather-widget">
      <div className="weather-header">
        <span className="weather-loc">{location}</span>
        <span className="weather-time">Now</span>
      </div>
      <div className="weather-main">
        <span className="weather-temp">{weather.temp}°C</span>
        <span className="weather-icon">{weather.icon}</span>
      </div>
      <div className="weather-details">
        <span>{weather.condition}</span>
        <span>•</span>
        <span>H: {weather.humidity}</span>
        <span>•</span>
        <span>W: {weather.wind}</span>
      </div>
    </div>
  );
};

export const QuickActions = () => {
  const actions = [
    { label: 'Add Log', icon: '📝', color: 'var(--accent)' },
    { label: 'New Cost', icon: '💰', color: 'var(--success)' },
    { label: 'Upload Doc', icon: '📁', color: 'var(--purple)' },
    { label: 'Alert team', icon: '🔔', color: 'var(--danger)' },
  ];

  return (
    <div className="quick-actions-panel">
      <div className="panel-title">Quick Actions</div>
      <div className="actions-grid">
        {actions.map(a => (
          <button key={a.label} className="action-item-btn" style={{ '--item-color': a.color }}>
            <span className="action-icon">{a.icon}</span>
            <span className="action-label">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
