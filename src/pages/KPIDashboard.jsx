import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';

const MiniBar = ({ value, max, color = 'var(--accent)' }) => (
  <div style={{ background: 'var(--border)', borderRadius: '99px', height: '6px', minWidth: '80px', flex: 1 }}>
    <div style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, height: '6px', borderRadius: '99px', background: color, transition: 'width 0.6s ease' }} />
  </div>
);

const KPIDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('profitability');

  useEffect(() => {
    fetchData();
    const sync = () => fetchData();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const fetchData = () => setData(adminApi.getKPIData());


  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics...</div>;

  const { projects, engineerPerf } = data;

  const totalBudget = projects.reduce((s, p) => s + p.totalBudget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.totalSpent, 0);
  const totalProfit = projects.reduce((s, p) => s + p.profitMargin, 0);
  const avgProgress = projects.length ? projects.reduce((s, p) => s + p.progress, 0) / projects.length : 0;
  const totalOverdue = projects.reduce((s, p) => s + p.overdueTasks, 0);

  const sorted = {
    profitability: [...projects].sort((a, b) => b.profitMargin - a.profitMargin),
    delay: [...projects].sort((a, b) => a.scheduleVariance - b.scheduleVariance),
    resources: [...projects].sort((a, b) => b.laborDays - a.laborDays),
    efficiency: [...projects].sort((a, b) => b.costEfficiency - a.costEfficiency)
  };

  const maxProfit = Math.max(...projects.map(p => Math.abs(p.profitMargin)), 1);
  const maxLabor = Math.max(...projects.map(p => p.laborDays), 1);

  const tabs = [
    { key: 'profitability', label: '💰 Profitability', icon: '💰' },
    { key: 'delay', label: '📅 Schedule Variance', icon: '📅' },
    { key: 'resources', label: '👷 Resource Utilization', icon: '👷' },
    { key: 'efficiency', label: '📊 Cost Efficiency', icon: '📊' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Advanced KPI Dashboard</h1>
          <p className="page-subtitle">Project profitability, schedule variance, engineer performance, and resource analytics.</p>
        </div>
        <button className="btn-secondary" onClick={fetchData}>🔄 Refresh</button>
      </div>

      {/* Top KPIs */}
      <div className="stat-grid" style={{ marginBottom: '32px' }}>
        <StatCard icon="💼" label="Total Portfolio Budget" value={`₹${(totalBudget / 100000).toFixed(1)}L`} />
        <StatCard icon="💸" label="Total Costs Incurred" value={`₹${(totalSpent / 100000).toFixed(1)}L`} color="warning" />
        <StatCard icon="💎" label="Est. Portfolio Profit" value={`₹${(totalProfit / 100000).toFixed(1)}L`} color={totalProfit >= 0 ? 'success' : 'danger'} />
        <StatCard icon="⚠️" label="Overdue Tasks (All)" value={totalOverdue} color={totalOverdue > 0 ? 'danger' : 'success'} />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: '8px 18px', borderRadius: '99px', border: '1px solid var(--border)', background: activeTab === t.key ? 'var(--accent)' : 'var(--surface)', color: activeTab === t.key ? '#fff' : 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profitability Ranking */}
      {activeTab === 'profitability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>💰 Project Profitability Ranking</div>
          {sorted.profitability.map((p, i) => (
            <div key={p.project_id} onClick={() => navigate(`/projects/${p.project_id}`)} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, width: '32px', color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : 'var(--text-muted)' }}>#{i+1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{p.project_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.location}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <MiniBar value={Math.abs(p.profitMargin)} max={maxProfit} color={p.profitMargin >= 0 ? 'var(--success)' : 'var(--danger)'} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: p.profitMargin >= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{(p.profitMargin / 100000).toFixed(1)}L</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Budget: ₹{(p.totalBudget/100000).toFixed(1)}L · Spent: ₹{(p.totalSpent/100000).toFixed(1)}L</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Variance / Delay Analytics */}
      {activeTab === 'delay' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>📅 Schedule Variance — Ahead (+) vs Behind (−)</div>
          {sorted.delay.map(p => {
            const sv = p.scheduleVariance;
            const color = p.riskLevel === 'Critical' ? '#ef4444' : p.riskLevel === 'High' ? '#f59e0b' : '#22c55e';
            const label = p.riskLevel === 'Critical' ? 'Critical Risk' : p.riskLevel === 'High' ? 'High Risk' : 'On Track';
            return (
              <div key={p.project_id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: `1px solid ${p.riskLevel === 'Critical' ? '#fecaca' : 'var(--border)'}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: `4px solid ${color}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700 }}>{p.project_name}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {p.projectedDelay > 0 && <span style={{ fontSize: '11px', background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Projected Delay: {p.projectedDelay} days</span>}
                      <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: color + '22', color, fontWeight: 700 }}>{label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>Progress: <strong>{p.progress}%</strong></span>
                    <span>Time Elapsed: <strong>{p.timeElapsed}%</strong></span>
                    <span>Days Left: <strong>{p.daysLeft !== null ? p.daysLeft : 'N/A'}</strong></span>
                    <span>Overdue Tasks: <strong style={{ color: p.overdueTasks > 0 ? 'var(--danger)' : 'inherit' }}>{p.overdueTasks}</strong></span>
                  </div>
                  {/* Dual Progress Bar */}
                  <div style={{ position: 'relative', height: '8px', background: 'var(--border)', borderRadius: '99px' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '8px', width: `${p.timeElapsed}%`, background: '#cbd5e1', borderRadius: '99px' }} title={`Time ${p.timeElapsed}%`} />
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '8px', width: `${p.progress}%`, background: color, borderRadius: '99px', opacity: 0.85 }} title={`Progress ${p.progress}%`} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '10px', marginTop: '4px', color: 'var(--text-muted)' }}>
                    <span style={{ color: '#94a3b8' }}>■ Time elapsed</span>
                    <span style={{ color }}>■ Actual progress</span>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '20px', color, minWidth: '60px', textAlign: 'right' }}>{sv > 0 ? '+' : ''}{sv}%</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resource Utilization */}
      {activeTab === 'resources' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>👷 Labor & Resource Utilization</div>
          {sorted.resources.map(p => (
            <div key={p.project_id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.project_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last update: {p.daysSinceUpdate < 999 ? `${p.daysSinceUpdate} days ago` : 'Never'}</div>
                </div>
                {p.daysSinceUpdate > 7 && <Badge label="🕒 Inactive" variant="warning" />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', fontSize: '13px' }}>
                {[['👷 Labor Days', p.laborDays, maxLabor, 'var(--accent)'], ['💸 Wages (₹L)', (p.totalWages/100000).toFixed(1), null, 'var(--warning)'], ['📸 Site Updates', p.updateCount, null, 'var(--success)']].map(([lbl, val, max, color]) => (
                  <div key={lbl}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{lbl}</div>
                    <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{val}</div>
                    {max && <MiniBar value={Number(val)} max={max} color={color} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cost Efficiency */}
      {activeTab === 'efficiency' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>📊 Cost Efficiency — Budget Remaining %</div>
          {sorted.efficiency.map(p => (
            <div key={p.project_id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{p.project_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MiniBar value={p.costEfficiency} max={100} color={p.costEfficiency > 30 ? 'var(--success)' : p.costEfficiency > 10 ? 'var(--warning)' : 'var(--danger)'} />
                  <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '40px' }}>{p.costEfficiency}%</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Spent ₹{(p.totalSpent/100000).toFixed(1)}L of ₹{(p.totalBudget/100000).toFixed(1)}L budget</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: p.taskRate > 60 ? 'var(--success)' : 'var(--warning)' }}>{p.taskRate}%</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Task Rate</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Engineer Performance */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>🏆 Team Performance Leaderboard</div>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {engineerPerf.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No team activity data yet.</div>
          ) : engineerPerf.map((eng, i) => (
            <div key={eng.user_id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, width: '28px', color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--text-muted)' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                {eng.avatar || eng.name?.slice(0,2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{eng.name}</div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', flexWrap: 'wrap' }}>
                  <span>💰 {eng.userCosts} costs</span>
                  <span>📸 {eng.userUpdates} updates</span>
                  <span>📝 {eng.userLogs} logs</span>
                  <span>✅ {eng.userTasks} tasks</span>
                </div>
              </div>
              <Badge label={eng.role} variant="info" />
              <div style={{ textAlign: 'right', minWidth: '60px' }}>
                <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--accent)' }}>{eng.activityScore}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Activity Score</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KPIDashboard;
