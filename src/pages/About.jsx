import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// ============================================================
// MASTER FEATURE REGISTRY — Update this file whenever a new
// feature is added. It auto-renders for all role views.
// ============================================================

const APP_VERSION = 'v2.0 — Enterprise Edition';
const LAST_UPDATED = '03 May 2026';

const ALL_FEATURES = [
  // Module, path, icon, description, who_can_access[]
  { module: 'Executive Dashboard', path: '/', icon: '📊', desc: 'Global overview of all projects, financials, risk alerts, and AI insights.', roles: ['admin'] },
  { module: 'Client Dashboard', path: '/', icon: '🏠', desc: 'Personalized project view with progress, budget, updates, and team contacts.', roles: ['client'] },
  { module: 'Projects', path: '/projects', icon: '🏗️', desc: 'Create, manage, and view all construction projects with full CRUD.', roles: ['admin', 'engineer'] },
  { module: 'Progress Tracker', path: '/progress', icon: '📈', desc: 'Update stage completion percentages with weighted progress formula.', roles: ['admin', 'engineer', 'client'] },
  { module: 'Financial Command Center', path: '/costs', icon: '💰', desc: 'Log costs by category/stage. Budget vs Actual charts. Profit margin tracking.', roles: ['admin', 'engineer'] },
  { module: 'Structured Site Updates', path: '/updates', icon: '📸', desc: 'Post tagged site updates with Before/After image comparison. Filter by tags.', roles: ['admin', 'engineer', 'architect', 'supervisor', 'contractor', 'client'] },
  { module: 'Material & Inventory', path: '/inventory', icon: '📦', desc: 'Track material stock, log deliveries/consumption, and get low-stock alerts.', roles: ['admin', 'engineer', 'supervisor', 'contractor'] },
  { module: 'Workforce & Attendance', path: '/attendance', icon: '👷', desc: 'Log daily labor headcount, trade type, wage calculation, and productivity.', roles: ['admin', 'engineer', 'supervisor', 'contractor'] },
  { module: 'Planning & Scheduler', path: '/scheduler', icon: '📅', desc: 'Schedule tasks with Gantt Chart view, assign by role, track status & deadlines.', roles: ['admin', 'engineer'] },
  { module: 'Approval & Workflow', path: '/approvals', icon: '📑', desc: 'Submit documents, design changes, materials for approval. Admin/Engineer reviews.', roles: ['admin', 'engineer', 'architect', 'supervisor', 'contractor'] },
  { module: 'Daily Logs', path: '/logs', icon: '📝', desc: 'Log daily work done, labor count, and site issues for site accountability.', roles: ['admin', 'engineer', 'supervisor', 'contractor'] },
  { module: 'Documents', path: '/documents', icon: '📄', desc: 'Upload and manage drawings, reports, permits, and handover documents.', roles: ['admin', 'engineer', 'architect', 'client'] },
  { module: 'Invoice & Payment', path: '/invoices', icon: '🧾', desc: 'Create milestone invoices, track payment history, and auto-notify clients.', roles: ['admin'] },
  { module: '🧠 Intelligence Center', path: '/risks', icon: '🧠', desc: 'Auto risk detection: budget overruns, inactivity, overdue tasks, deadline alerts. KPI dashboard.', roles: ['admin'] },
  { module: 'System Audit', path: '/audit', icon: '🛡️', desc: 'Monitor all user logins, data entries, and system usage statistics.', roles: ['admin'] },
  { module: 'User Management', path: '/users', icon: '👥', desc: 'Create, edit, and manage all platform users with role assignment.', roles: ['admin'] },
  { module: 'Notifications', path: null, icon: '🔔', desc: 'Real-time in-app notification bell for invoice alerts, approvals, and system events.', roles: ['admin', 'engineer', 'architect', 'supervisor', 'contractor', 'client'] },
  { module: 'Client Queries & Support', path: '/queries', icon: '❓', desc: 'Raise queries about building details. Threaded replies, status tracking (Open → In Progress → Resolved → Closed), priority levels, and admin notifications.', roles: ['admin', 'engineer', 'architect', 'supervisor', 'contractor', 'client'] },
];

const ROLE_META = {
  admin: { icon: '👑', label: 'Admin (PRADUL)', color: '#7c3aed', bg: '#f5f3ff', desc: 'Full god-mode access. Can see and control everything across all projects, users, finances, and the entire system.' },
  engineer: { icon: '⚙️', label: 'Engineer', color: '#0284c7', bg: '#f0f9ff', desc: 'Operational access. Manages costs, progress, scheduling, workforce, and reviews approval requests.' },
  architect: { icon: '📐', label: 'Architect', color: '#0891b2', bg: '#ecfeff', desc: 'Design & documentation. Uploads drawings, monitors updates, submits approval requests.' },
  supervisor: { icon: '🦺', label: 'Site Supervisor', color: '#b45309', bg: '#fffbeb', desc: 'Site-level access. Logs daily site work, workforce attendance, site updates, and material usage.' },
  contractor: { icon: '🏗️', label: 'Contractor', color: '#374151', bg: '#f9fafb', desc: 'Execution tracking. Records daily logs, material consumption, and posts site updates.' },
  client: { icon: '🏠', label: 'Client', color: '#059669', bg: '#f0fdf4', desc: 'Premium read-only view. Sees their own project progress, budget snapshot, updates, and team contacts.' },
};

const CHANGELOG = [
  { version: 'v2.1', date: '03 May 2026', changes: ['❓ Client Queries & Support module with threaded replies and resolution tracking'] },
  { version: 'v2.0', date: '03 May 2026', changes: ['📦 Material & Inventory Tracking with low-stock alerts', '👷 Workforce & Attendance with wage calculator', '💰 Financial Command Center with Budget vs Actual Gantt', '📅 Planning & Scheduler with Gantt Chart + List views', '📑 Approval & Workflow system with full review chain', '🧾 Invoice & Payment module with client auto-notifications', '🔔 Live Notification Bell in topbar', '🧠 Intelligence Center with auto risk detection & KPI dashboard', '📸 Structured updates with Tags + Before/After images', 'ℹ️ This About / Features page'] },
  { version: 'v1.5', date: '19 Apr 2026', changes: ['🛡️ System Audit dashboard for admin oversight', '👥 User Management with Contractor role support', '🔐 Role-Based Access Control (RBAC) with feature-level permissions', '⚡ Quick-login buttons on login page', '🗄️ JSON file-based database with live cross-tab sync'] },
  { version: 'v1.0', date: 'Jan 2026', changes: ['Initial platform with Admin, Engineer, Architect, Supervisor, Contractor, Client roles', 'Projects, Progress, Costs, Updates, Documents, Daily Logs modules', 'Client dashboard with hero slideshow and 3D model viewer'] },
];

const About = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(user.role === 'admin' ? 'all' : user.role);

  const roles = Object.keys(ROLE_META);
  const myFeatures = ALL_FEATURES.filter(f => f.roles.includes(user.role));
  const visibleFeatures = activeTab === 'all' ? ALL_FEATURES : ALL_FEATURES.filter(f => f.roles.includes(activeTab));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">ℹ️ About LUDARP Platform</h1>
          <p className="page-subtitle">{APP_VERSION} · Last updated: {LAST_UPDATED} · Your role: <strong>{user.role}</strong></p>
        </div>
      </div>

      {/* Your Access Summary */}
      <div style={{ background: ROLE_META[user.role]?.bg || 'var(--surface)', borderRadius: 'var(--radius)', border: `2px solid ${ROLE_META[user.role]?.color || 'var(--border)'}`, padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <span style={{ fontSize: '36px' }}>{ROLE_META[user.role]?.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px', color: ROLE_META[user.role]?.color }}>You are: {ROLE_META[user.role]?.label}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{ROLE_META[user.role]?.desc}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
          {myFeatures.map(f => (
            <span key={f.module} onClick={() => f.path && navigate(f.path)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'white', borderRadius: '99px', fontSize: '12px', fontWeight: 600, border: `1px solid ${ROLE_META[user.role]?.color}`, color: ROLE_META[user.role]?.color, cursor: f.path ? 'pointer' : 'default', transition: 'all 0.2s' }}>
              {f.icon} {f.module}
            </span>
          ))}
        </div>
      </div>

      {/* Feature Matrix (Admin sees all, others see role filter) */}
      {user.role === 'admin' && (
        <>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>📋 Full Feature Matrix</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button onClick={() => setActiveTab('all')} style={{ padding: '6px 16px', borderRadius: '99px', border: '1px solid var(--border)', background: activeTab === 'all' ? 'var(--accent)' : 'white', color: activeTab === 'all' ? 'white' : 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>All Features</button>
            {roles.map(r => (
              <button key={r} onClick={() => setActiveTab(r)} style={{ padding: '6px 16px', borderRadius: '99px', border: `1px solid ${ROLE_META[r].color}`, background: activeTab === r ? ROLE_META[r].color : 'white', color: activeTab === r ? 'white' : ROLE_META[r].color, fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                {ROLE_META[r].icon} {ROLE_META[r].label}
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {visibleFeatures.map(f => (
          <div key={f.module} onClick={() => f.path && navigate(f.path)} style={{ background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '20px', cursor: f.path ? 'pointer' : 'default', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: 'var(--shadow-sm)' }}
            onMouseEnter={e => { if(f.path) { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>{f.module}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>{f.desc}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {f.roles.map(r => (
                <span key={r} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: ROLE_META[r]?.bg || '#f3f4f6', color: ROLE_META[r]?.color || '#374151', fontWeight: 600 }}>{ROLE_META[r]?.icon} {r}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Changelog */}
      {user.role === 'admin' && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>📦 Version Changelog</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {CHANGELOG.map((v, i) => (
              <div key={v.version} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', background: i === 0 ? 'var(--accent)' : 'var(--surface)', color: i === 0 ? '#fff' : 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{v.version} {i === 0 && '🆕 Latest'}</span>
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>{v.date}</span>
                </div>
                <ul style={{ margin: 0, padding: '16px 20px 16px 36px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {v.changes.map((c, j) => <li key={j} style={{ fontSize: '13px', lineHeight: '1.5' }}>{c}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* For non-admin: show a simplified changelog */}
      {user.role !== 'admin' && (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '20px' }}>
          <div style={{ fontWeight: 700, marginBottom: '12px' }}>🆕 What's New in {APP_VERSION}</div>
          <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {CHANGELOG[0].changes.map((c, i) => <li key={i} style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text)' }}>{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default About;
