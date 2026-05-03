import React, { useEffect, useState, useRef } from 'react';
import { adminApi } from '../services/api';
import StatCard from '../components/StatCard';
import Chart from 'chart.js/auto';
import { AIInsight, MiniWeather, QuickActions } from '../components/DashboardWidgets';

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
      return c.health === 'critical' || Number(c.spent) > Number(p.total_budget) * 0.85;
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
        datasets: [{ 
          label: 'Overall Progress (%)', 
          data: pData, 
          backgroundColor: 'rgba(46, 134, 193, 0.8)',
          borderColor: '#2E86C1',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: { 
        responsive: true, 
        plugins: { legend: { display: false } }, 
        indexAxis: 'y',
        scales: { x: { max: 100 } }
      }
    });

    const cLabels = Object.keys(data.catBreakdown);
    const cData = Object.values(data.catBreakdown);
    const colors = ['#2E86C1','#1E8449','#B7770D','#7D3C98','#C0392B'];

    chartInstances.current.pie = new Chart(pieRef.current.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: cLabels,
        datasets: [{ 
          data: cData, 
          backgroundColor: colors.slice(0, cLabels.length),
          borderWidth: 0,
          hoverOffset: 15
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        cutout: '75%', 
        plugins: { 
          legend: { 
            position: 'bottom',
            labels: { usePointStyle: true, padding: 20 }
          } 
        } 
      }
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
         <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-secondary">Export Report</button>
            <button className="btn-primary">Generate PDF</button>
         </div>
      </div>

      <div className="dashboard-top-grid">
        <AIInsight 
          projectCount={data.totalProjects} 
          riskCount={data.riskProjects.length}
          totalSpent={data.totalSpent}
          totalBudget={data.totalBudget}
        />
        <MiniWeather location="Kozhikode, KL" />
      </div>

      <div className="stat-grid">
        <StatCard icon="🏗️" label="Total Projects" value={data.totalProjects} color="primary" />
        <StatCard icon="₹" label="Total Budget" value={`₹${data.totalBudget.toLocaleString('en-IN')}`} color="success" />
        <StatCard icon="💸" label="Total Spent" value={`₹${data.totalSpent.toLocaleString('en-IN')}`} color="danger" />
        <StatCard icon="🟢" label="Active Sites" value={data.activeProjects} color="primary" />
      </div>

      <div className="dashboard-top-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <div className="card-grid-2" style={{ marginBottom: 0 }}>
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px', fontWeight: '700', letterSpacing: '0.5px' }}>Project Completion Velocity</h3>
            <canvas ref={barRef} style={{ maxHeight: '250px' }}></canvas>
          </div>
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px', fontWeight: '700', letterSpacing: '0.5px' }}>Material vs Labor Split</h3>
            <div style={{ height: '250px' }}><canvas ref={pieRef}></canvas></div>
          </div>
        </div>
        <QuickActions />
      </div>

      <div className="card-grid-2" style={{ marginTop: '24px' }}>
         {/* Recent updates */}
         <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Site Activity Feed</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               {data.recentUpdates.length > 0 ? data.recentUpdates.map(u => {
                 const p = adminApi.getProjectById(u.project_id);
                 return (
                   <div key={u.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
                     <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '20px', flexShrink: 0 }}>
                       {u.image_url ? '📸' : '📝'}
                     </div>
                     <div style={{ flexGrow: 1 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>
                         <strong>{p?.project_name || u.project_id}</strong>
                         <span>{new Date(u.date).toLocaleDateString('en-GB')}</span>
                       </div>
                       <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: '500' }}>{u.description}</div>
                     </div>
                   </div>
                 );
               }) : <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No recent updates.</div>}
            </div>
            <button className="btn-secondary" style={{ width: '100%', borderRadius: 0, border: 'none', borderTop: '1px solid var(--border)', fontSize: '12px' }}>View Full Audit Log</button>
         </div>

         {/* Risks */}
         <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', color: 'var(--danger)' }}>⚠️ Priority Attention Needed</div>
            <div style={{ padding: '20px' }}>
              {data.riskProjects.length > 0 ? data.riskProjects.map(p => (
                <div key={p.project_id} style={{ padding: '16px', background: 'var(--danger-light)', borderRadius: 'var(--radius-sm)', border: '1px solid #f1cdd0', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{p.project_name}</div>
                    <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>Budget overrun risk at {p.current_stage} stage.</div>
                  </div>
                  <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '11px' }}>Review</button>
                </div>
              )) : <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>🛡️</div>
                    <div style={{ color: 'var(--success)', fontWeight: 700 }}>Health Check Passed</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>All 4 active projects are within budget.</div>
                  </div>}
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
