import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Badge from './Badge';

const Topbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  if (!user) return null;

  const fetchNotifs = () => setNotifs(adminApi.getNotifications(user.user_id));

  useEffect(() => {
    fetchNotifs();
    const syncHandler = () => fetchNotifs();
    window.addEventListener('storage', syncHandler);
    const interval = setInterval(fetchNotifs, 15000);
    return () => { window.removeEventListener('storage', syncHandler); clearInterval(interval); };
  }, [user]);

  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  const handleOpen = () => {
    setOpen(o => !o);
  };

  const handleMarkAll = () => {
    adminApi.markAllRead(user.user_id);
    fetchNotifs();
  };

  const handleClickNotif = (n) => {
    adminApi.markNotificationRead(n.id, user.user_id);
    fetchNotifs();
    setOpen(false);
  };

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        {/* Notification Bell */}
        <div className="notification-bell" ref={bellRef} style={{ position: 'relative' }}>
          <button onClick={handleOpen} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', position: 'relative', padding: '4px' }}>
            🔔
            {unread > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 0, background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {open && (
            <div style={{ position: 'absolute', right: 0, top: '44px', width: '340px', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
                <span>🔔 Notifications {unread > 0 && <span style={{ fontSize: '11px', background: 'var(--danger)', color: '#fff', borderRadius: '99px', padding: '1px 6px', marginLeft: '6px' }}>{unread} new</span>}</span>
                {unread > 0 && <button onClick={handleMarkAll} style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>}
              </div>
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                    <div>You're all caught up!</div>
                  </div>
                ) : notifs.map(n => (
                  <div key={n.id} onClick={() => handleClickNotif(n)} style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.read ? 'transparent' : '#f0f6ff', transition: 'background 0.2s' }}>
                    <div style={{ fontSize: '22px', flexShrink: 0 }}>{n.icon || '📌'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: n.read ? 400 : 700, fontSize: '13px', marginBottom: '2px' }}>{n.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(n.created_at).toLocaleString('en-GB')}</div>
                    </div>
                    {!n.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '4px' }} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {user.role === 'admin' && (
          <button className="reset-btn" onClick={handleReset}>System Data</button>
        )}

        {/* User Profile with Sign Out Dropdown */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <div
            className="user-profile"
            onClick={() => setUserMenuOpen(o => !o)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Click for account options"
          >
            <div className="user-info" style={{ textAlign: 'right' }}>
              <span className="user-name">{user.name}</span>
              <Badge variant={user.role} label={user.role} />
            </div>
            <div className="user-avatar" style={{ background: 'var(--bg)', color: 'var(--accent)', border: '2px solid var(--accent)' }}>
              {user.avatar}
            </div>
          </div>

          {userMenuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '60px', width: '200px', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: '#f8f9fa' }}>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'capitalize' }}>{user.role} Account</div>
              </div>
              <button
                onClick={() => { setUserMenuOpen(false); navigate('/about'); }}
                style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                ℹ️ About & Features
              </button>
              <button
                onClick={() => { setUserMenuOpen(false); navigate('/queries'); }}
                style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                ❓ My Queries
              </button>
              <div style={{ borderTop: '1px solid var(--border)' }} />
              <button
                onClick={() => { setUserMenuOpen(false); logout(); }}
                style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e74c3c', fontWeight: 600 }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;

