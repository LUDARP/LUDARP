import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import Chart from 'chart.js/auto';

const Cost = ({ isAdmin }) => {
  const [data, setData] = useState({ project: null, costsData: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCost, setNewCost] = useState({ category: 'Materials', amount: '', date: new Date().toISOString().split('T')[0] });

  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  const fetchCosts = () => {
    const projectId = localStorage.getItem('ludarp_project_id');
    const projectRes = api.getProject(projectId);
    const costsRes = api.getCosts(projectId);

    if (projectRes?.success && costsRes?.success) {
      setData({ project: projectRes.data, costsData: costsRes.data });
    } else {
      setError('Failed to fetch costs data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  useEffect(() => {
    if (!data.costsData || !canvasRef.current) return;

    if (chartRef.current) chartRef.current.destroy();

    const breakdown = data.costsData.breakdown || {};
    const labels = Object.keys(breakdown);
    const values = Object.values(breakdown);

    const colorMap = { 'Materials': '#1A5276', 'Labor': '#1E8449', 'Miscellaneous': '#B7770D' };
    const backgroundColors = labels.map(label => colorMap[label] || '#5D6D7E');

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ label: 'Cost Breakdown (₹)', data: values, backgroundColor: backgroundColors }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [data]);

  const handleAddCost = (e) => {
    e.preventDefault();
    const projectId = localStorage.getItem('ludarp_project_id');
    if(newCost.amount) {
      api.addCost(projectId, newCost);
      fetchCosts();
      setIsModalOpen(false);
      setNewCost({ category: 'Materials', amount: '', date: new Date().toISOString().split('T')[0] });
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="error-msg">{error}</div>;

  const totalBudget = Number(data.project.total_budget || 0);
  const totalSpent = Number(data.costsData.total_spent || 0);
  const remaining = totalBudget - totalSpent;

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
          <div className="stat-value">₹{totalBudget.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Spent</div>
          <div className="stat-value red">₹{totalSpent.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Remaining</div>
          <div className={`stat-value ${remaining >= 0 ? 'green' : 'red'}`}>₹{remaining.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Cost Breakdown</h3>
        <canvas ref={canvasRef}></canvas>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Cost">
        <form onSubmit={handleAddCost}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={newCost.category} onChange={e => setNewCost({...newCost, category: e.target.value})}>
              <option>Materials</option>
              <option>Labor</option>
              <option>Miscellaneous</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input type="number" className="form-input" value={newCost.amount} onChange={e => setNewCost({...newCost, amount: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={newCost.date} onChange={e => setNewCost({...newCost, date: e.target.value})} required />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Cost;
