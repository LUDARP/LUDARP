import React from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import Badge from './Badge';

const Topbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  if (!user) return null;

  const handleReset = () => {
    if(window.confirm('Reset local database? This deletes all data!')) {
      adminApi.resetDB();
    }
  };

  return (
    <header className="topbar">
      <button className="menu-toggle" onClick={toggleSidebar}>☰</button>
      
      <div className="topbar-search-container">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Search projects or documents..." className="topbar-search-input" />
      </div>

      <div className="topbar-right">
        <div className="notification-bell">
          <span className="bell-icon">🔔</span>
          <span className="notification-dot"></span>
        </div>
        
        {user.role === 'admin' && (
          <button className="reset-btn" onClick={handleReset}>System Data</button>
        )}
        <div className="user-profile">
          <div className="user-info" style={{ textAlign: 'right' }}>
            <span className="user-name">{user.name}</span>
            <Badge variant={user.role} label={user.role} />
          </div>
          <div className="user-avatar" style={{ background: 'var(--bg)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
            {user.avatar}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
