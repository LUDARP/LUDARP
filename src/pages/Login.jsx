import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { login, user } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) {
    if (user.role === 'admin' || user.role === 'engineer' || user.role === 'client' || user.role === 'contractor') return <Navigate to="/" replace />;
    if (user.role === 'architect') return <Navigate to="/documents" replace />;
    if (user.role === 'supervisor') return <Navigate to="/updates" replace />;
  }

  const handleLogin = (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError("Please fill all fields.");
      return;
    }
    const res = login(userId, password);
    if (!res.success) {
      setError(res.error);
    }
  };

  const quickLogin = (uid) => {
    setUserId(uid);
    setPassword('admin123');
    const res = login(uid, 'admin123');
    if (!res.success) setError(res.error);
  };

  return (
    <div className="login-split">
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand-lg">LUDARP</div>
          <div className="login-tagline">Precision Engineering. <br/>Transparent Progress.</div>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-card-inner">
          <h2 className="login-form-title">Welcome Back</h2>
          <p className="login-form-desc">Sign in to access your LUDARP dashboard.</p>
          
          {error && <div className="error-msg" style={{ marginBottom: '20px' }}>{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="login-input-wrapper">
              <label className="form-label">User ID / Project ID</label>
              <input 
                type="text" 
                className="login-input" 
                placeholder="e.g. U001 or PROJ001"
                value={userId} 
                onChange={(e) => setUserId(e.target.value)} 
                required
              />
            </div>
            
            <div className="login-input-wrapper">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="login-input" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
            </div>

            <button type="submit" className="login-btn">Sign In</button>
          </form>

          <div className="login-demo-box">
             <span className="login-demo-title">Quick Role Access (Fast Test)</span>
             <div className="login-demo-grid">
                <button type="button" className="login-demo-item" onClick={() => quickLogin('U001')}>Admin <span className="login-demo-val">Login →</span></button>
                <button type="button" className="login-demo-item" onClick={() => quickLogin('PROJ001')}>Client <span className="login-demo-val">Login →</span></button>
                <button type="button" className="login-demo-item" onClick={() => quickLogin('U002')}>Engineer <span className="login-demo-val">Login →</span></button>
                <button type="button" className="login-demo-item" onClick={() => quickLogin('U005')}>Contractor <span className="login-demo-val">Login →</span></button>
                <button type="button" className="login-demo-item" onClick={() => quickLogin('U003')}>Architect <span className="login-demo-val">Login →</span></button>
                <button type="button" className="login-demo-item" onClick={() => quickLogin('U004')}>Supervisor <span className="login-demo-val">Login →</span></button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
