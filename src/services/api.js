import dummyData from '../data/dummy_data.json';

const DB_KEY = 'ludarp_admin_db';
const USER_KEY = 'ludarp_admin_user';

export const initDB = () => {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify(dummyData));
  }
};

const getDB = () => JSON.parse(localStorage.getItem(DB_KEY) || '{}');
const saveDB = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

// Weighted progress formula
const computeOverallProgress = (stages) => {
  const totalWeight = stages.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;
  return stages.reduce((sum, s) => sum + (Number(s.completion_percentage) * s.weight), 0) / totalWeight;
};

// Health indicator logic
const computeHealth = (spent, budget) => {
  if (budget <= 0) return spent > 0 ? "critical" : "good";
  const pct = (spent / budget) * 100;
  if (pct > 85) return "critical";
  if (pct >= 60) return "warning";
  return "good";
};

export const adminApi = {
  // Auth
  login: (userId, password) => {
    const db = getDB();
    const user = db.users?.find(u => u.user_id === userId && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem(USER_KEY, JSON.stringify(userWithoutPassword));
      return { success: true, data: userWithoutPassword };
    }

    // Check for client login (Project ID as username, client_password as password)
    const project = db.projects?.find(p => p.project_id === userId && p.client_password === password);
    if (project) {
      const clientUser = {
        user_id: project.project_id,
        name: project.client_name,
        role: 'client',
        project_ids: [project.project_id],
        avatar: project.client_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      };
      localStorage.setItem(USER_KEY, JSON.stringify(clientUser));
      return { success: true, data: clientUser };
    }

    return { success: false, error: 'Invalid credentials' };
  },
  getCurrentUser: () => JSON.parse(localStorage.getItem(USER_KEY)),
  logout: () => localStorage.removeItem(USER_KEY),
  resetDB: () => { localStorage.removeItem(DB_KEY); window.location.reload(); },

  // Projects
  getProjects: () => getDB().projects || [],
  getProjectById: (projectId) => {
    const db = getDB();
    return db.projects?.find(p => p.project_id === projectId) || null;
  },
  addProject: (data) => {
    const db = getDB();
    const project_id = data.project_id || 'PROJ' + Date.now();
    const newProj = { ...data, project_id, status: 'active', project_images: data.project_images || [] };
    if (!db.projects) db.projects = [];
    db.projects.push(newProj);
    
    // Auto-create standard 11 stages for a new project
    const stdStages = dummyData.stages.filter(s => s.project_id === 'PROJ001').map(s => ({
      ...s, project_id, completion_percentage: 0, stage_spent: 0, notes: ''
    }));
    if (!db.stages) db.stages = [];
    db.stages.push(...stdStages);
    
    saveDB(db);
    return newProj;
  },
  updateProject: (projectId, updates) => {
    let db = getDB();
    let idx = db.projects.findIndex(p => p.project_id === projectId);
    if (idx > -1) {
      db.projects[idx] = { ...db.projects[idx], ...updates };
      saveDB(db);
      return true;
    }
    return false;
  },
  deleteProject: (projectId) => {
    let db = getDB();
    db.projects = db.projects.filter(p => p.project_id !== projectId);
    db.stages = db.stages.filter(s => s.project_id !== projectId);
    db.costs = db.costs.filter(c => c.project_id !== projectId);
    db.updates = db.updates.filter(u => u.project_id !== projectId);
    db.documents = db.documents.filter(d => d.project_id !== projectId);
    saveDB(db);
    return true;
  },

  // Stages
  getStages: (projectId) => {
    const db = getDB();
    const stages = db.stages?.filter(s => s.project_id === projectId) || [];
    const overallProgress = computeOverallProgress(stages);
    return { stages, overallProgress };
  },
  updateStage: (projectId, stageName, data) => {
    let db = getDB();
    let stage = db.stages?.find(s => s.project_id === projectId && s.stage_name === stageName);
    if (stage) {
      if (data.completion_percentage !== undefined) stage.completion_percentage = Number(data.completion_percentage);
      if (data.notes !== undefined) stage.notes = data.notes;
      saveDB(db);
      
      // Update overall progress on project dynamically if requested, 
      // but typically we recalculate on read.
      return true;
    }
    return false;
  },
  
  // Costs
  getCosts: (projectId) => {
    const db = getDB();
    return db.costs?.filter(c => c.project_id === projectId) || [];
  },
  getAllCosts: () => getDB().costs || [],
  getCostSummary: (projectId) => {
    const db = getDB();
    const costs = db.costs?.filter(c => c.project_id === projectId) || [];
    const project = db.projects?.find(p => p.project_id === projectId);
    const total_budget = project ? Number(project.total_budget) : 0;
    
    let total_spent = 0;
    let by_category = {};
    let by_stage = {};
    
    costs.forEach(c => {
      const amt = Number(c.amount);
      total_spent += amt;
      by_category[c.category] = (by_category[c.category] || 0) + amt;
      by_stage[c.stage_name] = (by_stage[c.stage_name] || 0) + amt;
    });

    return { 
      total_budget, 
      total_spent, 
      remaining: total_budget - total_spent, 
      by_category, 
      by_stage, 
      health: computeHealth(total_spent, total_budget)
    };
  },
  addCost: (projectId, data) => {
    let db = getDB();
    const newCost = { id: 'c_' + Date.now(), project_id: projectId, ...data };
    if(!db.costs) db.costs = [];
    db.costs.push(newCost);
    
    // Add to stage spent
    let stage = db.stages?.find(s => s.project_id === projectId && s.stage_name === data.stage_name);
    if (stage) stage.stage_spent = (stage.stage_spent || 0) + Number(data.amount);
    
    saveDB(db);
    return newCost;
  },
  deleteCost: (costId) => {
    let db = getDB();
    // Revert stage spent logic
    const cost = db.costs?.find(c => c.id === costId);
    if (cost) {
       let stage = db.stages?.find(s => s.project_id === cost.project_id && s.stage_name === cost.stage_name);
       if (stage && stage.stage_spent >= Number(cost.amount)) {
           stage.stage_spent -= Number(cost.amount);
       }
       db.costs = db.costs.filter(c => c.id !== costId);
       saveDB(db);
       return true;
    }
    return false;
  },

  // Updates
  getUpdates: (projectId) => {
    const db = getDB();
    let upds = db.updates || [];
    
    if (projectId && projectId !== 'all') {
      upds = upds.filter(u => u.project_id === projectId);
    }
    
    return [...upds].sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  addUpdate: (projectId, data) => {
    let db = getDB();
    const newUpdate = { id: 'u_' + Date.now(), project_id: projectId, ...data };
    if(!db.updates) db.updates = [];
    db.updates.push(newUpdate);
    saveDB(db);
    return newUpdate;
  },
  deleteUpdate: (updateId) => {
    let db = getDB();
    db.updates = db.updates?.filter(u => u.id !== updateId) || [];
    saveDB(db);
    return true;
  },

  // Documents
  getDocuments: (projectId) => {
    const db = getDB();
    if (projectId && projectId !== 'all') return db.documents?.filter(d => d.project_id === projectId) || [];
    return db.documents || [];
  },
  addDocument: (projectId, data) => {
    let db = getDB();
    const newDoc = { id: 'd_' + Date.now(), project_id: projectId, uploaded_date: new Date().toISOString().split('T')[0], ...data };
    if(!db.documents) db.documents = [];
    db.documents.push(newDoc);
    saveDB(db);
    return newDoc;
  },
  deleteDocument: (docId) => {
    let db = getDB();
    db.documents = db.documents?.filter(d => d.id !== docId) || [];
    saveDB(db);
    return true;
  },

  // Logs
  getLogs: (projectId) => {
    const db = getDB();
    let list = db.logs || [];
    if (projectId && projectId !== 'all') {
      list = list.filter(l => l.project_id === projectId);
    }
    return [...list].sort((a,b) => new Date(b.date) - new Date(a.date));
  },
  addLog: (projectId, data) => {
    let db = getDB();
    const newLog = { id: 'l_' + Date.now(), project_id: projectId, ...data };
    if(!db.logs) db.logs = [];
    db.logs.push(newLog);
    saveDB(db);
    return newLog;
  },
  deleteLog: (logId) => {
    let db = getDB();
    db.logs = db.logs?.filter(l => l.id !== logId) || [];
    saveDB(db);
    return true;
  },

  // Users
  getUsers: () => getDB().users || [],
  addUser: (data) => {
    let db = getDB();
    const newUser = { ...data };
    if (!db.users) db.users = [];
    db.users.push(newUser);
    saveDB(db);
    return newUser;
  },
  updateUser: (userId, updates) => {
    let db = getDB();
    let idx = db.users.findIndex(u => u.user_id === userId);
    if(idx > -1) {
      db.users[idx] = { ...db.users[idx], ...updates };
      saveDB(db);
      return true;
    }
    return false;
  },
  deleteUser: (userId) => {
    let db = getDB();
    db.users = db.users.filter(u => u.user_id !== userId);
    saveDB(db);
    return true;
  }
};
