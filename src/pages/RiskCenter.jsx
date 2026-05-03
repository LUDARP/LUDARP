import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';

const severityColor = { critical: '#e74c3c', warning: '#f39c12' };
const typeIcon = { budget: '💰', inactivity: '🕒', deadline: '📅', task: '📋' };

const RiskCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [projects, setProjects] = useState([]);
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    fetchAll();
    const syncHandler = () => fetchAll();
    window.addEventListener('storage', syncHandler);
    return () => window.removeEventListener('storage', syncHandler);
  }, []);

  const fetchAll = () => {
    const projs = adminApi.getProjects();
    setProjects(projs);
    setAlerts(adminApi.getRiskAnalysis());
    const db = JSON.parse(localStorage.getItem('ludarp_admin_db') || '{}');
    setLoginHistory((db.login_history || []).slice(0, 20));

    // KPI Calculations
    const stages = db.stages || [];
    const costs = db.costs || [];
    const updates = db.updates || [];
    const logs = db.logs || [];
    const attendance = db.attendance || [];
    const tasks = db.tasks || [];

    const totalBudget = stages.reduce((s, st) => s + (st.stage_budget || 0), 0);
    const totalSpent = stages.reduce((s, st) => s + (st.stage_spent || 0), 0);
    const totalWages = attendance.reduce((s, a) => s + (a.total_wage || 0), 0);
    const doneTasks = tasks.filter(t => t.status === 'done').length;

    // Progress across all projects
    let totalProgress = 0;
    projs.forEach(p => {
      const { overallProgress } = adminApi.getStages(p.project_id);
      totalProgress += overallProgress;
    });
    const avgProgress = projs.length ? totalProgress / projs.length : 0;

    setKpis({
      totalBudget, totalSpent,
      profitMargin: totalBudget - totalSpent - totalWages,
      avgProgress,
      totalUpdates: updates.length,
      totalLogs: logs.length,
      wagesPaid: totalWages,
      taskCompletionRate: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0
    });
  };

  const critical = alerts.filter(a => a.severity === 'critical');
  const warnings = alerts.filter(a => a.severity === 'warning');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🧠 Intelligence Center</h1>
          <p className="page-subtitle">Smart risk detection, KPI analytics, and platform activity insights.</p>
        </div>
        <button className="btn-secondary" onClick={fetchAll}>🔄 Refresh Analysis</button>
      </div>

      {/* Live Risk Alerts */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚠️ Live Risk Alerts
          {critical.length > 0 && <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>{critical.length} Critical</span>}
        </h3>

        {alerts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛡️</div>
            <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '16px' }}>All Systems Healthy</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>No risks detected across all projects.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map((alert, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: alert.severity === 'critical' ? '#fff5f5' : '#fffbf0', borderRadius: 'var(--radius)', border: `1px solid ${alert.severity === 'critical' ? '#f1cdd0' : '#f8d7a0'}`, borderLeft: `4px solid ${severityColor[alert.severity]}` }}>
                <span style={{ fontSize: '24px' }}>{typeIcon[alert.type]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: severityColor[alert.severity], textTransform: 'uppercase', marginBottom: '2px' }}>{alert.severity} · {alert.project}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text)' }}>{alert.message}</div>
                </div>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }} onClick={() => navigate(`/projects/${alert.project_id}`)}>Review →</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPI Dashboard */}
      {kpis && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>📊 Key Performance Indicators</h3>
          <div className="stat-grid">
            <StatCard icon="💎" label="Est. Profit Margin" value={`₹${kpis.profitMargin.toLocaleString('en-IN')}`} color={kpis.profitMargin < 0 ? 'danger' : 'success'} />
            <StatCard icon="📈" label="Avg Project Progress" value={`${kpis.avgProgress.toFixed(1)}%`} color="primary" />
            <StatCard icon="✅" label="Task Completion Rate" value={`${kpis.taskCompletionRate}%`} color="success" />
            <StatCard icon="💸" label="Total Wages Paid" value={`₹${kpis.wagesPaid.toLocaleString('en-IN')}`} color="warning" />
          </div>
          <div className="stat-grid" style={{ marginTop: '16px' }}>
            <StatCard icon="💰" label="Total Client Budget" value={`₹${kpis.totalBudget.toLocaleString('en-IN')}`} />
            <StatCard icon="🏗️" label="Total Costs Logged" value={`₹${kpis.totalSpent.toLocaleString('en-IN')}`} color="danger" />
            <StatCard icon="📸" label="Total Site Updates" value={kpis.totalUpdates} />
            <StatCard icon="📝" label="Total Daily Logs" value={kpis.totalLogs} />
          </div>
        </div>
      )}

      {/* Project Health Ranking */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>🏆 Project Health Ranking</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {projects.map((proj, idx) => {
            const { overallProgress } = adminApi.getStages(proj.project_id);
            const costSummary = adminApi.getCostSummary(proj.project_id);
            const projAlerts = alerts.filter(a => a.project_id === proj.project_id);
            const health = projAlerts.some(a => a.severity === 'critical') ? 'critical' : projAlerts.some(a => a.severity === 'warning') ? 'warning' : 'good';
            return (
              <div key={proj.project_id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate(`/projects/${proj.project_id}`)}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-muted)', width: '24px' }}>#{idx+1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{proj.project_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{proj.location}</div>
                </div>
                <div style={{ width: '160px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>Progress</span><span style={{ fontWeight: 700 }}>{overallProgress.toFixed(1)}%</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: '99px', height: '8px' }}>
                    <div style={{ width: `${overallProgress}%`, background: overallProgress > 70 ? 'var(--success)' : overallProgress > 40 ? 'var(--accent)' : 'var(--danger)', height: '8px', borderRadius: '99px', transition: 'width 0.5s' }} />
                  </div>
                </div>
                <Badge label={health === 'critical' ? '🔴 Critical' : health === 'warning' ? '🟡 Warning' : '🟢 Healthy'} variant={health === 'critical' ? 'danger' : health === 'warning' ? 'warning' : 'success'} />
                <span style={{ fontSize: '13px', color: costSummary.health === 'critical' ? 'var(--danger)' : 'var(--success)' }}>₹{costSummary.total_spent.toLocaleString('en-IN')} spent</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Login Activity */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>🔐 Recent Platform Activity</h3>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {loginHistory.map((entry, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: i < loginHistory.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px' }}>
                {entry.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{entry.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(entry.time).toLocaleString('en-GB')}</div>
              </div>
              <Badge label={entry.role} variant="info" />
            </div>
          ))}
          {loginHistory.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity.</div>}
        </div>
      </div>
    </div>
  );
};

export default RiskCenter;
