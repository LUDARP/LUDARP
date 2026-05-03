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

const DashboardSelector = () => {
  const { user } = useAuth();
  if (user?.role === 'client') return <ClientDashboard />;
  return <AdminDashboard />;
};

// Toast System
const ToastContainer = ({ toasts }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        <span>{t.type === 'success' ? '✅' : '❌'}</span>
        <span>{t.message}</span>
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

  // Attach global toast emitter
  useEffect(() => {
    window.showToast = (message, type = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };
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

  useEffect(() => {
    initDB();
  }, []);

  if (loading) return <Loader />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      
      <Route path="/" element={<ProtectedRoute><LayoutContainer><DashboardSelector /></LayoutContainer></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute feature="projects"><LayoutContainer><Projects /></LayoutContainer></ProtectedRoute>} />
      <Route path="/projects/:projectId" element={<ProtectedRoute feature="projects"><LayoutContainer><ProjectDetail /></LayoutContainer></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute feature="progress"><LayoutContainer><Progress /></LayoutContainer></ProtectedRoute>} />
      <Route path="/costs" element={<ProtectedRoute feature="costs"><LayoutContainer><Costs /></LayoutContainer></ProtectedRoute>} />
      <Route path="/updates" element={<ProtectedRoute feature="updates"><LayoutContainer><Updates /></LayoutContainer></ProtectedRoute>} />
      <Route path="/logs" element={<ProtectedRoute feature="logs"><LayoutContainer><Logs /></LayoutContainer></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute feature="documents"><LayoutContainer><Documents /></LayoutContainer></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute feature="users"><LayoutContainer><Users /></LayoutContainer></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/LUDARP">
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
