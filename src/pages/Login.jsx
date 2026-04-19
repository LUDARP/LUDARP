import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const Login = () => {
  const [projectId, setProjectId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    if (!projectId || !password) {
      setError('Please enter both Project ID and Password');
      return;
    }

    setLoading(true);
    // Fake delay
    setTimeout(() => {
      const response = api.login(projectId, password);
      if (response && response.success && response.data) {
        localStorage.setItem('ludarp_project_id', response.data.project_id);
        navigate('/');
      } else {
        setError(response?.error || 'Invalid credentials');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">LUDARP Client Portal</h2>
        
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Project ID (Try: PROJ001)</label>
            <input 
              type="text" 
              className="form-input"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g. PROJ001"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password (Try: client123)</label>
            <input 
              type="password" 
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Logging In...' : 'Login Access'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
