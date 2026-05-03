import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { adminApi, initDB } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Loader from './components/Loader';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Progress from './pages/Progress';
import Costs from './pages/Costs';
import Updates from './pages/Updates';
import Documents from './pages/Documents';
import Users from './pages/Users';
import Logs from './pages/Logs';
import Inventory from './pages/Inventory';
import Attendance from './pages/Attendance';
import Scheduler from './pages/Scheduler';
import Approvals from './pages/Approvals';
import RiskCenter from './pages/RiskCenter';
import Invoices from './pages/Invoices';
import About from './pages/About';
import Queries from './pages/Queries';
import BIMViewer from './pages/BIMViewer';
import KPIDashboard from './pages/KPIDashboard';
import RBACManager from './pages/RBACManager';
import SystemAudit from './pages/SystemAudit';
import Warranties from './pages/Warranties';
import LiveSite from './pages/LiveSite';


const DashboardSelector = () => {
  const { user } = useAuth();
  if (user?.role === 'client') return <ClientDashboard />;
  return <AdminDashboard />;
};

// Toast System
const ToastContainer = ({ toasts }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`} style={{ animation: 'slideIn 0.3s ease forwards' }}>
        <span style={{ fontSize: '18px' }}>
          {t.type === 'success' ? '✅' : t.type === 'danger' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>{t.type.toUpperCase()}</div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>{t.message}</div>
        </div>
      </div>
    ))}
  </div>
);


const ProtectedRoute = ({ children, feature }) => {
  const { user, canAccess } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (feature && !canAccess(feature)) {
    // Redirect logic based on role if they hit a wall
    if (user.role === 'admin' || user.role === 'engineer') return <Navigate to="/" replace />;
    if (user.role === 'architect') return <Navigate to="/documents" replace />;
    if (user.role === 'supervisor') return <Navigate to="/updates" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

const LayoutContainer = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Attach global toast emitter & real-time notification sync
  useEffect(() => {
    window.showToast = (message, type = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const handleStorage = (e) => {
      if (e.type === 'storage' && e.key === 'ludarp_admin_db') {
        const db = JSON.parse(e.newValue || '{}');
        const lastNotif = db.notifications?.[0];
        if (lastNotif && new Date(lastNotif.created_at) > new Date(Date.now() - 2000)) {
           // If it's for current user
           const user = adminApi.getCurrentUser();
           if (lastNotif.to === user?.user_id || (lastNotif.to === 'admin' && user?.role === 'admin')) {
              window.showToast(lastNotif.message, 'info');
           }
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="main-wrapper">
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="main-content">
          {children}
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    initDB().then(() => setDbLoaded(true));
    
    // Global listener for cross-tab sync
    const syncHandler = (e) => {
      if (e.type === 'storage' || e.key === 'ludarp_admin_db') {
        // Force a tiny re-render or let specific components handle it.
        // Actually, just having the event is good enough for components that listen.
      }
    };
    window.addEventListener('storage', syncHandler);
    return () => window.removeEventListener('storage', syncHandler);
  }, []);

  if (loading || !dbLoaded) return <Loader />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      
      <Route path="/" element={<ProtectedRoute><LayoutContainer><DashboardSelector /></LayoutContainer></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute feature="projects"><LayoutContainer><Projects /></LayoutContainer></ProtectedRoute>} />
      <Route path="/projects/:projectId" element={<ProtectedRoute feature="projects"><LayoutContainer><ProjectDetail /></LayoutContainer></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute feature="progress"><LayoutContainer><Progress /></LayoutContainer></ProtectedRoute>} />
      <Route path="/costs" element={<ProtectedRoute feature="costs"><LayoutContainer><Costs /></LayoutContainer></ProtectedRoute>} />
      <Route path="/updates" element={<ProtectedRoute feature="updates"><LayoutContainer><Updates /></LayoutContainer></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute feature="inventory"><LayoutContainer><Inventory /></LayoutContainer></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute feature="attendance"><LayoutContainer><Attendance /></LayoutContainer></ProtectedRoute>} />
      <Route path="/scheduler" element={<ProtectedRoute feature="scheduler"><LayoutContainer><Scheduler /></LayoutContainer></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute feature="approvals"><LayoutContainer><Approvals /></LayoutContainer></ProtectedRoute>} />
      <Route path="/risks" element={<ProtectedRoute feature="audit"><LayoutContainer><RiskCenter /></LayoutContainer></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute feature="invoices"><LayoutContainer><Invoices /></LayoutContainer></ProtectedRoute>} />
      <Route path="/queries" element={<ProtectedRoute><LayoutContainer><Queries /></LayoutContainer></ProtectedRoute>} />
      <Route path="/bim" element={<ProtectedRoute feature="bim"><LayoutContainer><BIMViewer /></LayoutContainer></ProtectedRoute>} />
      <Route path="/kpi" element={<ProtectedRoute feature="kpi"><LayoutContainer><KPIDashboard /></LayoutContainer></ProtectedRoute>} />
      <Route path="/rbac" element={<ProtectedRoute feature="rbac"><LayoutContainer><RBACManager /></LayoutContainer></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><LayoutContainer><About /></LayoutContainer></ProtectedRoute>} />
      <Route path="/logs" element={<ProtectedRoute feature="logs"><LayoutContainer><Logs /></LayoutContainer></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute feature="documents"><LayoutContainer><Documents /></LayoutContainer></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute feature="audit"><LayoutContainer><SystemAudit /></LayoutContainer></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute feature="users"><LayoutContainer><Users /></LayoutContainer></ProtectedRoute>} />
      <Route path="/warranties" element={<ProtectedRoute feature="warranties"><LayoutContainer><Warranties /></LayoutContainer></ProtectedRoute>} />
      <Route path="/live" element={<ProtectedRoute feature="live_site"><LayoutContainer><LiveSite /></LayoutContainer></ProtectedRoute>} />

      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
