import React, { useEffect, useState, useRef } from 'react';
import { adminApi } from '../services/api';
import StatCard from '../components/StatCard';
import Chart from 'chart.js/auto';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const barRef = useRef(null);
  const pieRef = useRef(null);
  const chartInstances = useRef({ bar: null, pie: null });

  useEffect(() => {
    // Collect stats on mount
    const projects = adminApi.getProjects();
    const allCosts = adminApi.getAllCosts();
    
    let totalBudget = 0;
    let totalSpent = 0;
    let activecount = 0;
    
    const catBreakdown = {};
    const projProgressMap = {};

    projects.forEach(p => {
      totalBudget += Number(p.total_budget);
      if(p.status === 'active') activecount++;
      
      const pStats = adminApi.getStages(p.project_id);
      projProgressMap[p.project_name] = pStats.overallProgress;
    });

    allCosts.forEach(c => {
      const amt = Number(c.amount);
      totalSpent += amt;
      catBreakdown[c.category] = (catBreakdown[c.category] || 0) + amt;
    });

    const updates = adminApi.getUpdates('all').slice(0, 5); // global top 5
    
    const riskProjects = projects.filter(p => {
      const c = adminApi.getCostSummary(p.project_id);
      return c.health === 'critical';
    });

    setData({
      totalProjects: projects.length,
      totalBudget,
      totalSpent,
      activeProjects: activecount,
      catBreakdown,
      projProgressMap,
      recentUpdates: updates,
      riskProjects
    });
  }, []);

  useEffect(() => {
    if (!data || !barRef.current || !pieRef.current) return;

    if (chartInstances.current.bar) chartInstances.current.bar.destroy();
    if (chartInstances.current.pie) chartInstances.current.pie.destroy();

    const pLabels = Object.keys(data.projProgressMap);
    const pData = Object.values(data.projProgressMap);

    chartInstances.current.bar = new Chart(barRef.current.getContext('2d'), {
      type: 'bar',
      data: {
        labels: pLabels,
        datasets: [{ label: 'Overall Progress (%)', data: pData, backgroundColor: '#2E86C1' }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, indexAxis: 'y' }
    });

    const cLabels = Object.keys(data.catBreakdown);
    const cData = Object.values(data.catBreakdown);
    const colors = ['#2E86C1','#1E8449','#B7770D','#7D3C98','#C0392B'];

    chartInstances.current.pie = new Chart(pieRef.current.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: cLabels,
        datasets: [{ data: cData, backgroundColor: colors.slice(0, cLabels.length) }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right' } } }
    });

    return () => {
      if(chartInstances.current.bar) chartInstances.current.bar.destroy();
      if(chartInstances.current.pie) chartInstances.current.pie.destroy();
    }
  }, [data]);

  if(!data) return null;

  return (
    <div>
      <div className="page-header">
         <div>
           <h1 className="page-title">Executive Dashboard</h1>
           <p className="page-subtitle">Global overview of all active projects and financials.</p>
         </div>
      </div>

      <div className="stat-grid">
        <StatCard icon="🏗️" label="Total Projects" value={data.totalProjects} color="primary" />
        <StatCard icon="₹" label="Total Budget" value={`₹${data.totalBudget.toLocaleString('en-IN')}`} color="success" />
        <StatCard icon="💸" label="Total Spent" value={`₹${data.totalSpent.toLocaleString('en-IN')}`} color="danger" />
        <StatCard icon="🟢" label="Active Sites" value={data.activeProjects} color="primary" />
      </div>

      <div className="card-grid-2">
        <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Project Progress Watch</h3>
          <canvas ref={barRef} style={{ maxHeight: '250px' }}></canvas>
        </div>
        <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Global Spending by Category</h3>
          <div style={{ height: '250px' }}><canvas ref={pieRef}></canvas></div>
        </div>
      </div>

      <div className="card-grid-2">
         {/* Recent updates */}
         <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', fontWeight: '600' }}>Recent Updates Log</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               {data.recentUpdates.length > 0 ? data.recentUpdates.map(u => {
                 const p = adminApi.getProjectById(u.project_id);
                 return (
                   <div key={u.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', color: 'var(--text-muted)' }}>
                       <strong>{p?.project_name || u.project_id}</strong>
                       <span>{new Date(u.date).toLocaleDateString('en-GB')}</span>
                     </div>
                     <div style={{ fontSize: '13px' }}>{u.description.substring(0, 80)}{u.description.length > 80 ? '...' : ''}</div>
                   </div>
                 );
               }) : <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No recent updates.</div>}
            </div>
         </div>

         {/* Risks */}
         <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', fontWeight: '600', color: 'var(--danger)' }}>⚠️ Projects at Risk (Budget &gt; 85%)</div>
            <div style={{ padding: '20px' }}>
              {data.riskProjects.length > 0 ? data.riskProjects.map(p => (
                <div key={p.project_id} style={{ padding: '16px', background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', border: '1px solid #f1cdd0', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--danger)' }}>{p.project_name} ({p.project_id})</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>Stage: {p.current_stage}</div>
                </div>
              )) : <div style={{ padding: '20px', textAlign: 'center', color: 'var(--success)', fontWeight: 600 }}>All projects are within safe budget margins.</div>}
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
