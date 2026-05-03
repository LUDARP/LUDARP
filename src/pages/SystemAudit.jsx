import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';

const SystemAudit = () => {
  const [loginHistory, setLoginHistory] = useState([]);
  const [stats, setStats] = useState({ docsToday: 0, updatesToday: 0, costsToday: 0, logsToday: 0 });

  useEffect(() => {
    fetchAuditData();
    
    // Listen to local storage changes to sync instantly across profiles/tabs
    const handleStorageChange = (e) => {
      if (e.key === 'ludarp_admin_db') {
        fetchAuditData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchAuditData = () => {
    setLoginHistory(adminApi.getLoginHistory());
    setStats(adminApi.getSystemStats());
  };

  const columns = [
    { key: 'time', label: 'Login Time', render: (row) => new Date(row.time).toLocaleString() },
    { key: 'user_id', label: 'User ID' },
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role', render: (row) => <span style={{ textTransform: 'capitalize' }}>{row.role}</span> }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Audit & Usage</h1>
          <p className="page-subtitle">Monitor user activity, login history, and daily data entries.</p>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text)' }}>Data Entered Today (Instant Sync)</h3>
        <div className="stat-grid">
          <StatCard icon="📸" label="Updates Today" value={stats.updatesToday} color="primary" />
          <StatCard icon="📝" label="Logs Today" value={stats.logsToday} color="warning" />
          <StatCard icon="💰" label="Costs Recorded" value={stats.costsToday} color="danger" />
          <StatCard icon="📄" label="Documents Added" value={stats.docsToday} color="success" />
        </div>
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Login History</span>
          <button className="btn-secondary" onClick={fetchAuditData}>Refresh Log</button>
        </div>
        <div style={{ padding: '20px' }}>
          {loginHistory.length > 0 ? (
            <DataTable columns={columns} data={loginHistory} />
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No login history found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemAudit;
