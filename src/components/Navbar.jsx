import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Navbar = ({ isAdmin, setIsAdmin }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('ludarp_project_id');
    navigate('/login');
  };

  const handleReset = () => {
    if(window.confirm('Reset local database? All changes will be lost.')) {
      localStorage.removeItem('ludarp_db');
      window.location.reload();
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">LUDARP</div>
      
      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} end>Dashboard</NavLink>
        <NavLink to="/cost" className={({ isActive }) => (isActive ? 'active' : '')}>Cost</NavLink>
        <NavLink to="/progress" className={({ isActive }) => (isActive ? 'active' : '')}>Progress</NavLink>
        <NavLink to="/updates" className={({ isActive }) => (isActive ? 'active' : '')}>Updates</NavLink>
        <NavLink to="/documents" className={({ isActive }) => (isActive ? 'active' : '')}>Documents</NavLink>
      </div>

      <div className="navbar-actions">
        {isAdmin && <button onClick={handleReset} className="reset-btn">Reset Data</button>}
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className={`admin-btn ${isAdmin ? 'active' : ''}`}
        >
          {isAdmin ? 'Admin Mode: ON' : 'Admin'}
        </button>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
