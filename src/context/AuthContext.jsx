import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/api';

const AuthContext = createContext();

const BASE_PERMISSIONS = {
  admin:      ['projects','progress','costs','updates','documents','users','audit','delete','edit','inventory','attendance','scheduler','approvals','invoices','bim','kpi','rbac'],
  engineer:   ['progress','costs','updates','documents','logs','inventory','attendance','scheduler','approvals','bim'],
  architect:  ['documents','updates','approvals','bim'],
  supervisor: ['updates','logs','inventory','attendance','approvals'],
  contractor: ['updates','logs','inventory','attendance','approvals'],
  client:     ['progress','updates','documents']
};

const ALL_FEATURES = ['projects','progress','costs','updates','documents','users','audit','delete','edit','inventory','attendance','scheduler','approvals','invoices','bim','kpi','rbac','logs'];

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
    if (result.success) setUser(result.data);
    return result;
  };

  const logout = () => { adminApi.logout(); setUser(null); };
  const isRole = (role) => user?.role === role;

  const canAccess = (feature) => {
    if (!user) return false;
    // Admin always has full access
    if (user.role === 'admin') return true;
    // Check access expiry
    if (user.access_expires && new Date(user.access_expires) < new Date()) return false;
    // Base role permissions
    const hasBase = BASE_PERMISSIONS[user.role]?.includes(feature) || false;
    if (hasBase) return true;
    // Custom permissions granted by admin
    return (user.custom_permissions || []).includes(feature);
  };

  const hasProjectAccess = (projectId) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.project_ids?.includes(projectId) || false;
  };

  const isExpired = () => user?.access_expires && new Date(user.access_expires) < new Date();

  return (
    <AuthContext.Provider value={{ user, login, logout, isRole, canAccess, hasProjectAccess, isExpired, ALL_FEATURES, BASE_PERMISSIONS, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

