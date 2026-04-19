import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/api';

const AuthContext = createContext();

const permissions = {
  admin:      ['projects', 'progress', 'costs', 'updates', 'documents', 'users', 'delete', 'edit'],
  engineer:   ['progress', 'costs', 'updates', 'documents', 'logs'],
  architect:  ['documents', 'updates'],
  supervisor: ['updates', 'logs'],
  contractor: ['updates', 'logs'],
  client:     ['progress', 'updates', 'documents']
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = adminApi.getCurrentUser();
    if (storedUser) setUser(storedUser);
    setLoading(false);
  }, []);

  const login = (userId, password) => {
    const result = adminApi.login(userId, password);
    if (result.success) {
      setUser(result.data);
    }
    return result;
  };

  const logout = () => {
    adminApi.logout();
    setUser(null);
  };

  const isRole = (role) => {
    return user?.role === role;
  };

  const canAccess = (feature) => {
    if (!user) return false;
    return permissions[user.role]?.includes(feature) || false;
  };

  const hasProjectAccess = (projectId) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.project_ids.includes(projectId);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isRole, canAccess, hasProjectAccess, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
