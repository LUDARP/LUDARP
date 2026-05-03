import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';
import StatCard from '../components/StatCard';

const statusColor = { pending: 'warning', 'in-progress': 'info', done: 'success', blocked: 'danger' };
const statusIcon = { pending: '⏳', 'in-progress': '🔨', done: '✅', blocked: '🚫' };
const STAGES = ['Planning & Approvals','Site Preparation','Foundation','Substructure','Structure','Roofing','Finishing','Services (MEP)','Interiors','External Works','Handover'];

const Scheduler = () => {
  const { user, canAccess } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterProject, setFilterProject] = useState('all');
  const [view, setView] = useState('gantt'); // gantt | list
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const initialForm = { project_id: '', title: '', stage: '', assignee_role: 'engineer', start_date: new Date().toISOString().split('T')[0], due_date: '', status: 'pending', priority: 'medium', notes: '' };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    let projs = adminApi.getProjects();
    if(user.role !== 'admin') projs = projs.filter(p => user.project_ids.includes(p.project_id));
    setProjects(projs);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [filterProject]);

  const fetchTasks = () => {
    let pId = filterProject;
    if(user.role !== 'admin' && user.role !== 'engineer') pId = user.project_ids[0];
    const list = adminApi.getTasks(pId).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    setTasks(list);
  };

  const handleOpenAdd = () => {
    setEditingTask(null);
    setFormData({ ...initialForm, project_id: filterProject === 'all' ? (projects[0]?.project_id || '') : filterProject });
    setIsModalOpen(true);
  };

  const handleEdit = (task) => { setEditingTask(task); setFormData({ ...task }); setIsModalOpen(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingTask) {
      adminApi.updateTask(editingTask.id, formData);
      window.showToast('Task updated');
    } else {
      adminApi.addTask(formData.project_id, { ...formData, created_by: user.user_id });
      window.showToast('Task scheduled');
    }
    fetchTasks();
    setIsModalOpen(false);
  };

  const handleDelete = (id) => { if(window.confirm('Delete task?')) { adminApi.deleteTask(id); fetchTasks(); } };
  const handleStatusCycle = (task) => {
    const cycle = ['pending', 'in-progress', 'done', 'blocked'];
    const next = cycle[(cycle.indexOf(task.status) + 1) % cycle.length];
    adminApi.updateTask(task.id, { status: next });
    fetchTasks();
    window.showToast(`Status → ${next}`);
  };

  // Gantt calculation
  const allDates = tasks.flatMap(t => [new Date(t.start_date), new Date(t.due_date)]).filter(d => !isNaN(d));
  const minDate = allDates.length ? new Date(Math.min(...allDates)) : new Date();
  const maxDate = allDates.length ? new Date(Math.max(...allDates)) : new Date(Date.now() + 30 * 86400000);
  const totalDays = Math.max(1, (maxDate - minDate) / 86400000) + 2;

  const getBar = (task) => {
    const start = Math.max(0, (new Date(task.start_date) - minDate) / 86400000);
    const end = (new Date(task.due_date) - minDate) / 86400000;
    const width = Math.max(1, end - start);
    return { left: `${(start / totalDays) * 100}%`, width: `${(width / totalDays) * 100}%` };
  };

  const done = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Planning & Scheduler</h1>
          <p className="page-subtitle">Schedule tasks, set milestones, and track execution timelines.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button onClick={() => setView('gantt')} style={{ padding: '8px 16px', border: 'none', background: view === 'gantt' ? 'var(--accent)' : 'transparent', color: view === 'gantt' ? '#fff' : 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>📊 Gantt</button>
            <button onClick={() => setView('list')} style={{ padding: '8px 16px', border: 'none', background: view === 'list' ? 'var(--accent)' : 'transparent', color: view === 'list' ? '#fff' : 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>📋 List</button>
          </div>
          {canAccess('edit') && <button className="btn-primary" onClick={handleOpenAdd}>+ Add Task</button>}
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard icon="📋" label="Total Tasks" value={tasks.length} />
        <StatCard icon="✅" label="Completed" value={done} color="success" />
        <StatCard icon="⚠️" label="Overdue" value={overdue} color="danger" />
        <StatCard icon="📈" label="Completion Rate" value={tasks.length ? `${Math.round((done/tasks.length)*100)}%` : '0%'} color="primary" />
      </div>

      {user.role === 'admin' && (
        <div className="filters-bar" style={{ marginBottom: '20px' }}>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="form-input" style={{ width: '280px' }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
          </select>
        </div>
      )}

      {/* GANTT VIEW */}
      {view === 'gantt' && (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Timeline View — {tasks.length} tasks
          </div>
          {tasks.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
              <div>No tasks scheduled yet. Click + Add Task to get started.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {tasks.map(task => {
                const bar = getBar(task);
                const isOverdue = task.status !== 'done' && task.due_date && new Date(task.due_date) < new Date();
                return (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', minHeight: '52px' }}>
                    <div style={{ width: '240px', minWidth: '240px', padding: '12px 16px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{task.stage}</div>
                    </div>
                    <div style={{ flex: 1, position: 'relative', height: '52px', minWidth: '300px' }}>
                      <div
                        style={{
                          position: 'absolute', top: '12px', height: '28px',
                          left: bar.left, width: bar.width,
                          background: task.status === 'done' ? 'var(--success)' : isOverdue ? 'var(--danger)' : task.status === 'blocked' ? '#6c757d' : 'var(--accent)',
                          borderRadius: '6px', display: 'flex', alignItems: 'center', padding: '0 8px',
                          fontSize: '11px', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden',
                          cursor: 'pointer', transition: 'opacity 0.2s'
                        }}
                        onClick={() => handleStatusCycle(task)}
                        title="Click to cycle status"
                      >
                        {statusIcon[task.status]} {task.title}
                      </div>
                    </div>
                    <div style={{ width: '80px', minWidth: '80px', padding: '0 12px', display: 'flex', alignItems: 'center' }}>
                      <Badge label={task.status} variant={statusColor[task.status] || 'info'} />
                    </div>
                    {canAccess('edit') && (
                      <div style={{ width: '80px', minWidth: '80px', padding: '0 8px', display: 'flex', gap: '4px' }}>
                        <button className="action-btn" onClick={() => handleEdit(task)}>✏️</button>
                        {canAccess('delete') && <button className="action-btn delete" onClick={() => handleDelete(task.id)}>🗑️</button>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.length === 0 ? <p className="muted">No tasks yet.</p> : tasks.map(task => {
            const isOverdue = task.status !== 'done' && task.due_date && new Date(task.due_date) < new Date();
            return (
              <div key={task.id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: `1px solid ${isOverdue ? 'var(--danger)' : 'var(--border)'}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={() => handleStatusCycle(task)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }} title="Click to cycle status">{statusIcon[task.status]}</button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text)' }}>{task.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{task.stage} · Due: {task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB') : 'No date'} {isOverdue ? '⚠️ OVERDUE' : ''}</div>
                </div>
                <Badge label={task.priority} variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'} />
                <Badge label={task.status} variant={statusColor[task.status]} />
                {canAccess('edit') && <button className="action-btn" onClick={() => handleEdit(task)}>✏️</button>}
                {canAccess('delete') && <button className="action-btn delete" onClick={() => handleDelete(task.id)}>🗑️</button>}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? 'Edit Task' : 'Schedule New Task'}>
        <form onSubmit={handleSave}>
          {user.role === 'admin' && <FormInput label="Project" type="select" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} options={projects.map(p => ({value: p.project_id, label: p.project_name}))} required />}
          <FormInput label="Task Title" type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormInput label="Construction Stage" type="select" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})} options={STAGES} required />
            <FormInput label="Assigned To (Role)" type="select" value={formData.assignee_role} onChange={e => setFormData({...formData, assignee_role: e.target.value})} options={['admin','engineer','architect','supervisor','contractor']} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormInput label="Start Date" type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
            <FormInput label="Due Date" type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormInput label="Priority" type="select" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} options={['low','medium','high']} />
            <FormInput label="Status" type="select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} options={['pending','in-progress','done','blocked']} />
          </div>
          <FormInput label="Notes" type="textarea" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editingTask ? 'Update Task' : 'Schedule Task'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Scheduler;
