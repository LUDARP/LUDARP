import React, { useRef, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, canAccess, logout } = useAuth();
  const navRef = useRef(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const links = [
    { to: "/", feature: null, icon: "🏠", label: "Dashboard" },
    { to: "/projects", feature: "projects", icon: "📁", label: "Projects" },
    { to: "/progress", feature: "progress", icon: "📊", label: "Progress" },
    { to: "/costs", feature: "costs", icon: "💰", label: "Costs" },
    { to: "/updates", feature: "updates", icon: "📸", label: "Updates" },
    { to: "/inventory", feature: "inventory", icon: "📦", label: "Inventory" },
    { to: "/attendance", feature: "attendance", icon: "👷", label: "Workforce" },
    { to: "/scheduler", feature: "scheduler", icon: "📅", label: "Scheduler" },
    { to: "/approvals", feature: "approvals", icon: "📑", label: "Approvals" },
    { to: "/logs", feature: "logs", icon: "📝", label: "Daily Logs" },
    { to: "/documents", feature: "documents", icon: "📄", label: "Documents" },
    { to: "/risks", feature: "audit", icon: "🧠", label: "Intelligence" },
    { to: "/invoices", feature: "invoices", icon: "🧾", label: "Invoices" },
    { to: "/queries", feature: null, icon: "❓", label: "Queries" },
    { to: "/bim", feature: "bim", icon: "🧱", label: "BIM Viewer" },
    { to: "/kpi", feature: "kpi", icon: "📊", label: "KPI Analytics" },
    { to: "/rbac", feature: "rbac", icon: "🔐", label: "Access Control" },
    { to: "/audit", feature: "audit", icon: "🛡️", label: "System Audit" },
    { to: "/users", feature: "users", icon: "👥", label: "Users" },
    { to: "/about", feature: null, icon: "ℹ️", label: "About & Features" }
  ];

  const checkScroll = () => {
    const el = navRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 10);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 10);
  };

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => { el.removeEventListener('scroll', checkScroll); window.removeEventListener('resize', checkScroll); };
  }, [user]);

  const scrollDown = () => navRef.current?.scrollBy({ top: 120, behavior: 'smooth' });
  const scrollUp = () => navRef.current?.scrollBy({ top: -120, behavior: 'smooth' });

  if (!user) return null;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">LUDARP <span>PORTAL</span></div>
      </div>

      {/* Scroll Up Button */}
      {canScrollUp && (
        <button onClick={scrollUp} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '6px', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          ▲ scroll up
        </button>
      )}
      
      <div className="sidebar-nav" ref={navRef} style={{ overflowY: 'auto', flex: 1, scrollbarWidth: 'none' }}>
        <style>{`.sidebar-nav::-webkit-scrollbar { display: none; }`}</style>
        {links.map(link => {
          if (link.feature && !canAccess(link.feature)) return null;
          if (link.to === '/' && (user.role === 'supervisor' || user.role === 'architect')) return null;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
              end={link.to === '/'}
            >
              <span>{link.icon}</span> {link.label}
            </NavLink>
          );
        })}
      </div>

      {/* Scroll Down Button */}
      {canScrollDown && (
        <button onClick={scrollDown} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '8px', cursor: 'pointer', fontSize: '14px', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', animation: 'pulse 2s infinite' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          <span style={{ fontSize: '18px' }}>⬇</span> more below
        </button>
      )}

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


