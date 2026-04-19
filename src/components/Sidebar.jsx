import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, canAccess, logout } = useAuth();

  const links = [
    { to: "/", feature: null, icon: "🏠", label: "Dashboard" },
    { to: "/projects", feature: "projects", icon: "📁", label: "Projects" },
    { to: "/progress", feature: "progress", icon: "📊", label: "Progress" },
    { to: "/costs", feature: "costs", icon: "💰", label: "Costs" },
    { to: "/updates", feature: "updates", icon: "📸", label: "Updates" },
    { to: "/logs", feature: "logs", icon: "📝", label: "Daily Logs" },
    { to: "/documents", feature: "documents", icon: "📄", label: "Documents" },
    { to: "/users", feature: "users", icon: "👥", label: "Users" }
  ];

  if (!user) return null;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">LUDARP <span>PORTAL</span></div>
      </div>
      
      <div className="sidebar-nav">
        {links.map(link => {
          // If a feature is specified and user can't access, skip rendering
          if (link.feature && !canAccess(link.feature)) return null;
          // Dashboard link is visible to everyone who has a home page
          if (link.to === '/' && (user.role === 'supervisor' || user.role === 'architect')) return null;

          return (
            <NavLink 
              key={link.to} 
              to={link.to} 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)} // mobile close
              end={link.to === '/'}
            >
              <span>{link.icon}</span> {link.label}
            </NavLink>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div className="user-avatar" style={{ background: 'rgba(255,255,255,0.1)' }}>{user.avatar}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{user.name}</span>
            <Badge variant={user.role} label={user.role} />
          </div>
        </div>
        <button className="btn-logout" onClick={logout}>Sign Out</button>
      </div>
    </aside>
  );
};

export default Sidebar;
