import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import Chart from 'chart.js/auto';

const Cost = ({ isAdmin }) => {
  const [data, setData] = useState({ project: null, costsData: null, stages: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCost, setNewCost] = useState({ stage_name: '', category: 'Materials', amount: '', date: new Date().toISOString().split('T')[0], note: '' });

  const barRef = useRef(null);
  const barCanvasRef = useRef(null);
  const pieRef = useRef(null);
  const pieCanvasRef = useRef(null);

  const fetchCosts = () => {
    const projectId = localStorage.getItem('ludarp_project_id');
    const projectRes = api.getProject(projectId);
    const costsRes = api.getCosts(projectId);
    const stagesRes = api.getStages(projectId);

    if (projectRes?.success && costsRes?.success && stagesRes?.success) {
      setData({ project: projectRes.data, costsData: costsRes.data, stages: stagesRes.data.stages });
      if(!newCost.stage_name && stagesRes.data.stages.length > 0) {
        setNewCost(prev => ({ ...prev, stage_name: stagesRes.data.stages[0].stage_name }));
      }
    } else {
      setError('Failed to fetch costs data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  useEffect(() => {
    if (!data.costsData || !barCanvasRef.current || !pieCanvasRef.current) return;

    if (barRef.current) barRef.current.destroy();
    if (pieRef.current) pieRef.current.destroy();

    const { breakdown_by_category, breakdown_by_stage } = data.costsData;
    
    // Bar Chart
    const catLabels = Object.keys(breakdown_by_category);
    const catValues = Object.values(breakdown_by_category);
    const colorMap = { 'Materials': '#1A5276', 'Labor': '#1E8449', 'Miscellaneous': '#B7770D' };
    
    const ctxBar = barCanvasRef.current.getContext('2d');
    barRef.current = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: catLabels,
        datasets: [{ label: 'Spent (₹)', data: catValues, backgroundColor: catLabels.map(l => colorMap[l] || '#5D6D7E') }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // Doughnut Chart
    const stageLabels = Object.keys(breakdown_by_stage).filter(k => breakdown_by_stage[k] > 0);
    const stageValues = stageLabels.map(k => breakdown_by_stage[k]);
    const palette = ['#2E86C1', '#17A589', '#D4AC0D', '#884EA0', '#CA6F1E', '#34495E'];

    const ctxPie = pieCanvasRef.current.getContext('2d');
    pieRef.current = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: stageLabels,
        datasets: [{ data: stageValues, backgroundColor: palette.slice(0, stageLabels.length) }]
      },
      options: { responsive: true, plugins: { legend: { position: 'right' } }, cutout: '70%' }
    });

    return () => {
      if (barRef.current) barRef.current.destroy();
      if (pieRef.current) pieRef.current.destroy();
    };
  }, [data]);

  const handleAddCost = (e) => {
    e.preventDefault();
    const projectId = localStorage.getItem('ludarp_project_id');
    if(newCost.amount) {
      api.addCost(projectId, newCost);
      fetchCosts();
      setIsModalOpen(false);
      setNewCost({ stage_name: data.stages[0]?.stage_name, category: 'Materials', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="error-msg">{error}</div>;

  const totalBudget = Number(data.project.total_budget || 0);
  const totalSpent = Number(data.costsData.total_spent || 0);
  const remaining = totalBudget - totalSpent;
  const spentPct = (totalSpent / totalBudget) * 100;
  
  let healthBadge = 'Green';
  let healthClass = 'badge-success';
  if (spentPct > 85) { healthBadge = 'Critical'; healthClass = 'badge-danger'; }
  else if (spentPct >= 60) { healthBadge = 'Warning'; healthClass = 'badge-warning'; }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Cost Tracking</h1>
        {isAdmin && (
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setIsModalOpen(true)}>
            + Log Cost
          </button>
        )}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-title">Total Budget</div>
          <div className="stat-value amount">₹{totalBudget.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Spent</div>
          <div className="stat-value amount red">₹{totalSpent.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Remaining</div>
          <div className={`stat-value amount ${remaining >= 0 ? 'green' : 'red'}`}>₹{remaining.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Budget Health</div>
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '12px' }}>
             <span className="stat-value">{spentPct.toFixed(1)}%</span>
             <span className={`badge ${healthClass}`}>{healthBadge}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="stat-card">
          <h3 style={{ fontSize: '15px' }}>Category Breakdown</h3>
          <canvas ref={barCanvasRef}></canvas>
        </div>
        <div className="stat-card">
          <h3 style={{ fontSize: '15px' }}>Stage Breakdown</h3>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
            <canvas ref={pieCanvasRef}></canvas>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Stage Budgets</h3>
      <div className="table-wrapper" style={{ marginBottom: '40px' }}>
        <table>
          <thead>
            <tr><th>Stage</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Health</th></tr>
          </thead>
          <tbody>
            {data.stages.map((s, i) => {
              const spent = s.stage_spent || 0;
              const remain = s.stage_budget - spent;
              const spct = (spent / s.stage_budget) * 100;
              
              let hTag = <span className="badge badge-success">On Track</span>;
              if (spct > s.completion_percentage + 10) hTag = <span className="badge badge-danger">Over Budget</span>;
              if (s.completion_percentage === 0 && spent === 0) hTag = <span className="badge badge-gray">Not Started</span>;

              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{s.stage_name}</td>
                  <td className="amount">₹{s.stage_budget.toLocaleString('en-IN')}</td>
                  <td className="amount" style={{ color: spent > 0 ? 'var(--danger)' : 'inherit' }}>₹{spent.toLocaleString('en-IN')}</td>
                  <td className="amount" style={{ color: remain < 0 ? 'var(--danger)' : 'var(--success)' }}>₹{remain.toLocaleString('en-IN')}</td>
                  <td>{hTag}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Cost Data Log</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Date</th><th>Stage</th><th>Category</th><th>Amount</th><th>Note</th></tr>
          </thead>
          <tbody>
            {data.costsData.rows.map((row, i) => (
              <tr key={i}>
                <td>{new Date(row.date).toLocaleDateString('en-GB')}</td>
                <td>{row.stage_name}</td>
                <td><span className="badge badge-gray">{row.category}</span></td>
                <td className="amount red">₹{row.amount.toLocaleString('en-IN')}</td>
                <td style={{ color: 'var(--muted)', fontSize: '13px' }}>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Cost">
        <form onSubmit={handleAddCost}>
          <div className="form-group">
            <label className="form-label">Stage</label>
            <select className="form-select" value={newCost.stage_name} onChange={e => setNewCost({...newCost, stage_name: e.target.value})}>
              {data.stages.map(s => <option key={s.stage_name} value={s.stage_name}>{s.stage_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={newCost.category} onChange={e => setNewCost({...newCost, category: e.target.value})}>
              <option>Materials</option><option>Labor</option><option>Miscellaneous</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input type="number" className="form-input" value={newCost.amount} onChange={e => setNewCost({...newCost, amount: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Note / Description</label>
            <input type="text" className="form-input" value={newCost.note} onChange={e => setNewCost({...newCost, note: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={newCost.date} onChange={e => setNewCost({...newCost, date: e.target.value})} required />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Log Cost</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Cost;
