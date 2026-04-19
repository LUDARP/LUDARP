import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import Chart from 'chart.js/auto';

const Costs = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const [costSummary, setCostSummary] = useState(null);
  const [costsList, setCostsList] = useState([]);
  const [stages, setStages] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCost, setNewCost] = useState({ stage_name: '', category: 'Materials', amount: '', date: new Date().toISOString().split('T')[0], note: '' });

  const barRef = useRef(null);
  const pieRef = useRef(null);
  const chartInstances = useRef({ bar: null, pie: null });

  useEffect(() => {
    let projs = adminApi.getProjects();
    if(user.role !== 'admin') projs = projs.filter(p => user.project_ids.includes(p.project_id));
    setProjects(projs);
    if(projs.length > 0) setSelectedProjectId(projs[0].project_id);
  }, [user]);

  useEffect(() => {
    if(!selectedProjectId) return;
    fetchCostData();
  }, [selectedProjectId]);

  const fetchCostData = () => {
    const sum = adminApi.getCostSummary(selectedProjectId);
    const list = adminApi.getCosts(selectedProjectId);
    const stg = adminApi.getStages(selectedProjectId).stages;
    
    setCostSummary(sum);
    // Add author name purely for visualization (Added By)
    const enrichedList = list.map(c => {
       const author = adminApi.getUsers().find(u => u.user_id === c.added_by);
       return { ...c, authorName: author ? author.name : c.added_by };
    }).sort((a,b) => new Date(b.date) - new Date(a.date));

    setCostsList(enrichedList);
    setStages(stg);
    
    if(stg.length > 0) setNewCost(prev => ({ ...prev, stage_name: stg[0].stage_name }));
  };

  useEffect(() => {
    if(!costSummary || !barRef.current || !pieRef.current) return;

    if (chartInstances.current.bar) chartInstances.current.bar.destroy();
    if (chartInstances.current.pie) chartInstances.current.pie.destroy();

    const cLabels = Object.keys(costSummary.by_category);
    const cData = Object.values(costSummary.by_category);
    const colors = {'Materials':'#2E86C1', 'Labor':'#1E8449', 'Miscellaneous':'#B7770D', 'Equipment':'#7D3C98', 'Professional Fees':'#5D6D7E'};

    chartInstances.current.bar = new Chart(barRef.current.getContext('2d'), {
      type: 'bar',
      data: {
        labels: cLabels,
        datasets: [{ label: 'Amount (₹)', data: cData, backgroundColor: cLabels.map(l => colors[l] || '#1C2833') }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const sLabels = Object.keys(costSummary.by_stage).filter(k => costSummary.by_stage[k] > 0);
    const sData = sLabels.map(k => costSummary.by_stage[k]);
    const palette = ['#2980B9', '#16A085', '#F39C12', '#8E44AD', '#D35400', '#2C3E50', '#27AE60', '#C0392B'];

    chartInstances.current.pie = new Chart(pieRef.current.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: sLabels,
        datasets: [{ data: sData, backgroundColor: palette.slice(0, sLabels.length) }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right' } } }
    });

    return () => {
      if(chartInstances.current.bar) chartInstances.current.bar.destroy();
      if(chartInstances.current.pie) chartInstances.current.pie.destroy();
    }
  }, [costSummary]);

  const handleAddCost = (e) => {
    e.preventDefault();
    if(Number(newCost.amount) <= 0) return;

    adminApi.addCost(selectedProjectId, {
      ...newCost,
      amount: Number(newCost.amount),
      added_by: user.user_id
    });
    
    fetchCostData();
    setIsModalOpen(false);
    setNewCost(prev => ({ ...prev, amount: '', note: '' }));
    window.showToast('Cost logged successfully');
  };

  const handleDelete = (id) => {
    adminApi.deleteCost(id);
    fetchCostData();
    window.showToast('Cost log deleted');
  };

  const columns = [
    { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString('en-GB') },
    { key: 'stage_name', label: 'Stage' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount', render: (row) => <span className="amount red">₹{Number(row.amount).toLocaleString('en-IN')}</span> },
    { key: 'note', label: 'Note' },
    { key: 'authorName', label: 'Added By' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cost Management</h1>
          <p className="page-subtitle">Track project expenditures.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div className="form-label" style={{ marginBottom: '4px' }}>Select Project</div>
           <select className="form-select" style={{ width: '250px' }} value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
             {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
           </select>
        </div>
      </div>

      {(costSummary && selectedProjectId) ? (
        <>
          <div className="stat-grid" style={{ marginBottom: '24px' }}>
            <StatCard icon="📊" label="Total Budget" value={`₹${costSummary.total_budget.toLocaleString('en-IN')}`} />
            <StatCard icon="💸" label="Total Spent" value={`₹${costSummary.total_spent.toLocaleString('en-IN')}`} color="danger" />
            <StatCard icon="💰" label="Remaining" value={`₹${costSummary.remaining.toLocaleString('en-IN')}`} color={costSummary.remaining < 0 ? 'danger' : 'success'} />
            <StatCard icon="🚦" label="Budget Health" value={costSummary.health.toUpperCase()} color={costSummary.health === 'critical' ? 'danger' : costSummary.health === 'warning' ? 'warning' : 'success'} />
          </div>

          <div className="card-grid-2">
            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
               <h3 style={{ fontSize: '15px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spending by Category</h3>
               <canvas ref={barRef} style={{ maxHeight: '250px' }}></canvas>
            </div>
            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
               <h3 style={{ fontSize: '15px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spending by Stage</h3>
               <div style={{ height: '250px' }}><canvas ref={pieRef}></canvas></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <h3 style={{ fontSize: '18px', margin: 0 }}>Cost Data Log</h3>
             <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Log Cost</button>
          </div>

          <DataTable columns={columns} data={costsList} onDelete={handleDelete} />

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Expense">
            <form onSubmit={handleAddCost}>
               <FormInput label="Project" type="select" value={selectedProjectId} options={projects.map(p => ({value: p.project_id, label: p.project_name}))} disabled />
               <FormInput label="Stage" type="select" value={newCost.stage_name} onChange={e => setNewCost({...newCost, stage_name: e.target.value})} options={stages.map(s => s.stage_name)} required />
               <FormInput label="Category" type="select" value={newCost.category} onChange={e => setNewCost({...newCost, category: e.target.value})} options={['Materials', 'Labor', 'Miscellaneous', 'Equipment', 'Professional Fees']} required />
               <FormInput label="Amount (₹)" type="number" value={newCost.amount} onChange={e => setNewCost({...newCost, amount: e.target.value})} required />
               <FormInput label="Date" type="date" value={newCost.date} onChange={e => setNewCost({...newCost, date: e.target.value})} required />
               <FormInput label="Note / Reference" type="text" value={newCost.note} onChange={e => setNewCost({...newCost, note: e.target.value})} />
               <div className="modal-actions">
                 <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                 <button type="submit" className="btn-primary">Save Log</button>
               </div>
            </form>
          </Modal>
        </>
      ) : (
        <p className="muted">Please select a project to view costs.</p>
      )}
    </div>
  );
};

export default Costs;
