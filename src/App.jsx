import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initDB } from './services/api';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cost from './pages/Cost';
import Progress from './pages/Progress';
import Updates from './pages/Updates';
import Documents from './pages/Documents';

const PrivateRoute = ({ children, isAdmin, setIsAdmin }) => {
  const isAuth = localStorage.getItem('ludarp_project_id');
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Navbar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      <div className="page-content">
        {children}
      </div>
    </>
  );
};

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    initDB(); // Seed the local database on app start
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute isAdmin={isAdmin} setIsAdmin={setIsAdmin}><Dashboard /></PrivateRoute>} />
        <Route path="/cost" element={<PrivateRoute isAdmin={isAdmin} setIsAdmin={setIsAdmin}><Cost isAdmin={isAdmin} /></PrivateRoute>} />
        <Route path="/progress" element={<PrivateRoute isAdmin={isAdmin} setIsAdmin={setIsAdmin}><Progress isAdmin={isAdmin} /></PrivateRoute>} />
        <Route path="/updates" element={<PrivateRoute isAdmin={isAdmin} setIsAdmin={setIsAdmin}><Updates isAdmin={isAdmin} /></PrivateRoute>} />
        <Route path="/documents" element={<PrivateRoute isAdmin={isAdmin} setIsAdmin={setIsAdmin}><Documents isAdmin={isAdmin} /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
