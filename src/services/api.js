import dummyData from '../data/dummy_data.json';

const DB_KEY = 'ludarp_admin_db';
const USER_KEY = 'ludarp_admin_user';

export const initDB = async () => {
  try {
    const res = await fetch('/api/sync');
    const data = await res.json();
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    if (!localStorage.getItem(DB_KEY)) {
      localStorage.setItem(DB_KEY, JSON.stringify(dummyData));
    }
  }
};

const getDB = () => JSON.parse(localStorage.getItem(DB_KEY) || '{}');

const SCHEMAS = {
const SCHEMAS = {
  project: ['project_id', 'project_name', 'location', 'client_name', 'status'],
  cost: ['id', 'project_id', 'amount', 'category', 'date', 'added_by'],
  update: ['id', 'project_id', 'text', 'date', 'added_by'],
  user: ['user_id', 'name', 'role', 'email']
};

const validate = (type, data) => {
  if (!SCHEMAS[type]) return true; // Generic validation
  const missing = SCHEMAS[type].filter(k => data[k] === undefined || data[k] === null || data[k] === '');
  if (missing.length > 0) {
    console.warn(`[Data Validation Warning] ${type} is missing fields:`, missing);
    return false;
  }
  return true;
};

const saveDB = (db) => {
  try {
    db.last_sync = new Date().toISOString();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    window.dispatchEvent(new Event('storage')); // Sync UI across tabs
    
    // In dev environment, also sync to file
    if (import.meta.env.DEV) {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db)
      }).catch(err => console.warn('Dev Sync failed:', err));
    }
    return true;
  } catch (err) {
    console.error('CRITICAL: Database Save Failed', err);
    return false;
  }
};


// Phase 2: Core Engine Strengthening — Precision Math
const computeOverallProgress = (stages) => {
  const totalWeight = stages.reduce((sum, s) => sum + (Number(s.weight) || 0), 0);
  if (totalWeight === 0) return 0;
  const progress = stages.reduce((sum, s) => sum + (Number(s.completion_percentage || 0) * (Number(s.weight) || 0)), 0) / totalWeight;
  return Math.round(progress * 100) / 100;
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
  // Phase 1 Optimization: Executive Summary (API Layer Business Logic)
  getExecutiveSummary: () => {
    const db = getDB();
    const projects = db.projects || [];
    const allCosts = db.costs || [];
    const updates = (db.updates || []).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    let totalBudget = 0;
    let totalSpent = 0;
    let activeProjects = 0;
    const catBreakdown = {};
    const projProgressMap = {};

    projects.forEach(p => {
      totalBudget += Number(p.total_budget);
      if (p.status === 'active') activeProjects++;
      const stages = db.stages?.filter(s => s.project_id === p.project_id) || [];
      projProgressMap[p.project_name] = computeOverallProgress(stages);
    });

    allCosts.forEach(c => {
      const amt = Number(c.amount);
      totalSpent += amt;
      catBreakdown[c.category] = (catBreakdown[c.category] || 0) + amt;
    });

    const riskProjects = projects.filter(p => {
      const costs = allCosts.filter(c => c.project_id === p.project_id);
      const spent = costs.reduce((sum, c) => sum + Number(c.amount), 0);
      return spent > Number(p.total_budget) * 0.85;
    });

    return {
      totalProjects: projects.length,
      totalBudget,
      totalSpent,
      activeProjects,
      catBreakdown,
      projProgressMap,
      recentUpdates: updates,
      riskProjects
    };
  },

  // Auth
  login: (userId, password) => {
    const db = getDB();
    let loggedInUser = null;

    const user = db.users?.find(u => u.user_id === userId && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      loggedInUser = userWithoutPassword;
    } else {
      const project = db.projects?.find(p => p.project_id === userId && p.client_password === password);
      if (project) {
        loggedInUser = {
          user_id: project.project_id,
          name: project.client_name,
          role: 'client',
          project_ids: [project.project_id],
          avatar: project.client_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        };
      }
    }

    if (loggedInUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
      if(!db.login_history) db.login_history = [];
      db.login_history.unshift({
        user_id: loggedInUser.user_id,
        name: loggedInUser.name,
        role: loggedInUser.role,
        time: new Date().toISOString()
      });
      saveDB(db);
      return { success: true, data: loggedInUser };
    }

    return { success: false, error: 'Invalid credentials' };
  },
  getCurrentUser: () => JSON.parse(localStorage.getItem(USER_KEY)),
  logout: () => localStorage.removeItem(USER_KEY),
  resetDB: () => { localStorage.removeItem(DB_KEY); window.location.reload(); },

  getLoginHistory: () => getDB().login_history || [],
  getSystemStats: () => {
    const db = getDB();
    const today = new Date().toISOString().split('T')[0];
    const docsToday = (db.documents || []).filter(d => d.uploaded_date && d.uploaded_date.startsWith(today)).length;
    const updatesToday = (db.updates || []).filter(u => u.date && u.date.startsWith(today)).length;
    const costsToday = (db.costs || []).filter(c => c.date && c.date.startsWith(today)).length;
    const logsToday = (db.logs || []).filter(l => l.date && l.date.startsWith(today)).length;
    
    return { docsToday, updatesToday, costsToday, logsToday };
  },

  // Projects
  getProjects: () => getDB().projects || [],
  getProjectById: (projectId) => {
    const db = getDB();
    return db.projects?.find(p => p.project_id === projectId) || null;
  },
  addProject: (data) => {
    if (!validate('project', data)) return null;
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
    db.logs = db.logs?.filter(l => l.project_id !== projectId) || [];
    db.bim_elements = db.bim_elements?.filter(e => e.project_id !== projectId) || [];
    db.queries = db.queries?.filter(q => q.project_id !== projectId) || [];
    db.invoices = db.invoices?.filter(i => i.project_id !== projectId) || [];
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
    const costData = { project_id: projectId, ...data };
    if (!validate('cost', costData)) return null;
    let db = getDB();
    const newCost = { id: 'c_' + Date.now(), ...costData };
    if(!db.costs) db.costs = [];
    db.costs.push(newCost);
    
    // Add to stage spent
    let stage = db.stages?.find(s => s.project_id === projectId && s.stage_name === data.stage_name);
    if (stage) stage.stage_spent = (stage.stage_spent || 0) + Number(data.amount);
    
    saveDB(db);
    return newCost;
  },
  updateCost: (costId, data) => {
    let db = getDB();
    const idx = db.costs?.findIndex(c => c.id === costId);
    if (idx > -1) {
       const oldCost = db.costs[idx];
       // Revert old stage spent
       let oldStage = db.stages?.find(s => s.project_id === oldCost.project_id && s.stage_name === oldCost.stage_name);
       if (oldStage) oldStage.stage_spent -= Number(oldCost.amount);
       
       // Update cost
       db.costs[idx] = { ...oldCost, ...data, amount: Number(data.amount) };
       
       // Add new stage spent
       let newStage = db.stages?.find(s => s.project_id === data.project_id && s.stage_name === data.stage_name);
       if (newStage) newStage.stage_spent = (newStage.stage_spent || 0) + Number(data.amount);
       
       saveDB(db);
       return true;
    }
    return false;
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
    const updData = { project_id: projectId, ...data };
    if (!validate('update', updData)) return null;
    let db = getDB();
    const newUpdate = { id: 'u_' + Date.now(), ...updData };
    if(!db.updates) db.updates = [];
    db.updates.push(newUpdate);
    
    // Phase 2: Dynamic Progress Link
    if (data.stage_name && data.new_progress !== undefined) {
      let stage = db.stages?.find(s => s.project_id === projectId && s.stage_name === data.stage_name);
      if (stage) {
        stage.completion_percentage = Number(data.new_progress);
        stage.notes = `Updated via log: ${data.text}`;
      }
    }
    
    saveDB(db);
    return newUpdate;
  },
  updateUpdate: (updateId, data) => {
    let db = getDB();
    const idx = db.updates?.findIndex(u => u.id === updateId);
    if (idx > -1) {
      db.updates[idx] = { ...db.updates[idx], ...data };
      saveDB(db);
      return true;
    }
    return false;
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
    const docs = projectId && projectId !== 'all' ? db.documents?.filter(d => d.project_id === projectId) || [] : db.documents || [];
    return docs.map(d => ({ ...d, file_data: undefined })); // Don't send heavy blobs by default
  },
  getDocumentData: (docId) => {
    const db = getDB();
    return db.documents?.find(d => d.id === docId)?.file_data || null;
  },
  addDocument: async (projectId, data, file) => {
    let db = getDB();
    let file_data = null;
    
    if (file) {
      file_data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    const newDoc = { 
      id: 'd_' + Date.now(), 
      project_id: projectId, 
      uploaded_date: new Date().toISOString().split('T')[0], 
      file_data,
      ...data 
    };
    
    if(!db.documents) db.documents = [];
    db.documents.push(newDoc);
    saveDB(db);
    return newDoc;
  },

  updateDocument: (docId, data) => {
    let db = getDB();
    const idx = db.documents?.findIndex(d => d.id === docId);
    if (idx > -1) {
      db.documents[idx] = { ...db.documents[idx], ...data };
      saveDB(db);
      return true;
    }
    return false;
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
  updateLog: (logId, data) => {
    let db = getDB();
    const idx = db.logs?.findIndex(l => l.id === logId);
    if (idx > -1) {
      db.logs[idx] = { ...db.logs[idx], ...data };
      saveDB(db);
      return true;
    }
    return false;
  },
  deleteLog: (logId) => {
    let db = getDB();
    db.logs = db.logs?.filter(l => l.id !== logId) || [];
    saveDB(db);
    return true;
  },
  // Inventory
  getInventory: (projectId) => {
    const db = getDB();
    if (projectId && projectId !== 'all') return db.inventory?.filter(i => i.project_id === projectId) || [];
    return db.inventory || [];
  },
  addInventoryItem: (projectId, data) => {
    let db = getDB();
    const newItem = { id: 'inv_' + Date.now(), project_id: projectId, ...data };
    if(!db.inventory) db.inventory = [];
    db.inventory.push(newItem);
    saveDB(db);
    return newItem;
  },
  updateInventoryItem: (itemId, data) => {
    let db = getDB();
    const idx = db.inventory?.findIndex(i => i.id === itemId);
    if (idx > -1) {
      db.inventory[idx] = { ...db.inventory[idx], ...data, last_updated: new Date().toISOString() };
      saveDB(db);
      return true;
    }
    return false;
  },
  deleteInventoryItem: (itemId) => {
    let db = getDB();
    db.inventory = db.inventory?.filter(i => i.id !== itemId) || [];
    saveDB(db);
    return true;
  },
  // Attendance
  getAttendance: (projectId) => {
    const db = getDB();
    if (projectId && projectId !== 'all') return db.attendance?.filter(a => a.project_id === projectId) || [];
    return db.attendance || [];
  },
  addAttendance: (projectId, data) => {
    let db = getDB();
    const newRecord = { id: 'att_' + Date.now(), project_id: projectId, ...data };
    if(!db.attendance) db.attendance = [];
    db.attendance.push(newRecord);
    saveDB(db);
    return newRecord;
  },
  deleteAttendance: (id) => {
    let db = getDB();
    db.attendance = db.attendance?.filter(a => a.id !== id) || [];
    saveDB(db);
    return true;
  },

  // Tasks (Planning & Scheduling)
  getTasks: (projectId) => {
    const db = getDB();
    if (projectId && projectId !== 'all') return db.tasks?.filter(t => t.project_id === projectId) || [];
    return db.tasks || [];
  },
  addTask: (projectId, data) => {
    let db = getDB();
    const newTask = { id: 'task_' + Date.now(), project_id: projectId, status: 'pending', ...data };
    if(!db.tasks) db.tasks = [];
    db.tasks.push(newTask);
    saveDB(db);
    return newTask;
  },
  updateTask: (taskId, data) => {
    let db = getDB();
    const idx = db.tasks?.findIndex(t => t.id === taskId);
    if (idx > -1) { db.tasks[idx] = { ...db.tasks[idx], ...data }; saveDB(db); return true; }
    return false;
  },
  deleteTask: (taskId) => {
    let db = getDB();
    db.tasks = db.tasks?.filter(t => t.id !== taskId) || [];
    saveDB(db);
    return true;
  },

  // Approvals (Workflow)
  getApprovals: (projectId) => {
    const db = getDB();
    if (projectId && projectId !== 'all') return db.approvals?.filter(a => a.project_id === projectId) || [];
    return db.approvals || [];
  },
  addApproval: (projectId, data) => {
    let db = getDB();
    const newApproval = { id: 'apr_' + Date.now(), project_id: projectId, status: 'pending', created_at: new Date().toISOString(), ...data };
    if(!db.approvals) db.approvals = [];
    db.approvals.push(newApproval);
    saveDB(db);
    return newApproval;
  },
  updateApproval: (approvalId, data) => {
    let db = getDB();
    const idx = db.approvals?.findIndex(a => a.id === approvalId);
    if (idx > -1) { db.approvals[idx] = { ...db.approvals[idx], ...data, reviewed_at: new Date().toISOString() }; saveDB(db); return true; }
    return false;
  },

  // Smart Risk Analysis
  getRiskAnalysis: () => {
    const db = getDB();
    const projects = db.projects || [];
    const stages = db.stages || [];
    const updates = db.updates || [];
    const tasks = db.tasks || [];
    const alerts = [];
    projects.forEach(proj => {
      const projStages = stages.filter(s => s.project_id === proj.project_id);
      const totalBudget = projStages.reduce((s, st) => s + (st.stage_budget || 0), 0);
      const totalSpent = projStages.reduce((s, st) => s + (st.stage_spent || 0), 0);
      if (totalBudget > 0 && (totalSpent / totalBudget) > 0.85)
        alerts.push({ type: 'budget', severity: 'critical', project: proj.project_name, project_id: proj.project_id, message: `Budget ${((totalSpent/totalBudget)*100).toFixed(0)}% utilized — overrun risk!` });
      else if (totalBudget > 0 && (totalSpent / totalBudget) > 0.6)
        alerts.push({ type: 'budget', severity: 'warning', project: proj.project_name, project_id: proj.project_id, message: `Budget ${((totalSpent/totalBudget)*100).toFixed(0)}% utilized — monitor closely.` });
      const projUpdates = updates.filter(u => u.project_id === proj.project_id);
      if (projUpdates.length > 0) {
        const lastUpdate = new Date(Math.max(...projUpdates.map(u => new Date(u.date))));
        const daysSince = (new Date() - lastUpdate) / (1000 * 60 * 60 * 24);
        if (daysSince > 7) alerts.push({ type: 'inactivity', severity: 'warning', project: proj.project_name, project_id: proj.project_id, message: `No site updates in ${Math.floor(daysSince)} days — possible delay!` });
      }
      if (proj.end_date) {
        const daysLeft = (new Date(proj.end_date) - new Date()) / (1000 * 60 * 60 * 24);
        if (daysLeft < 60 && daysLeft > 0) alerts.push({ type: 'deadline', severity: daysLeft < 30 ? 'critical' : 'warning', project: proj.project_name, project_id: proj.project_id, message: `${Math.floor(daysLeft)} days to project deadline!` });
        if (daysLeft < 0) alerts.push({ type: 'deadline', severity: 'critical', project: proj.project_name, project_id: proj.project_id, message: `Project is OVERDUE by ${Math.abs(Math.floor(daysLeft))} days!` });
      }
      const overdueTasks = tasks.filter(t => t.project_id === proj.project_id && t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date());
      if (overdueTasks.length > 0) alerts.push({ type: 'task', severity: 'warning', project: proj.project_name, project_id: proj.project_id, message: `${overdueTasks.length} task(s) are overdue!` });
    });
    return alerts;
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
  },

  // Invoices & Payments
  getInvoices: (projectId) => {
    const db = getDB();
    if (projectId && projectId !== 'all') return db.invoices?.filter(i => i.project_id === projectId) || [];
    return db.invoices || [];
  },
  addInvoice: (projectId, data) => {
    let db = getDB();
    const inv = { id: 'inv_' + Date.now(), project_id: projectId, status: 'unpaid', created_at: new Date().toISOString(), payments: [], ...data };
    if(!db.invoices) db.invoices = [];
    db.invoices.push(inv);
    saveDB(db);
    return inv;
  },
  updateInvoice: (invoiceId, data) => {
    let db = getDB();
    const idx = db.invoices?.findIndex(i => i.id === invoiceId);
    if (idx > -1) { db.invoices[idx] = { ...db.invoices[idx], ...data }; saveDB(db); return true; }
    return false;
  },
  addPayment: (invoiceId, payment) => {
    let db = getDB();
    const idx = db.invoices?.findIndex(i => i.id === invoiceId);
    if (idx > -1) {
      if(!db.invoices[idx].payments) db.invoices[idx].payments = [];
      db.invoices[idx].payments.push({ id: 'pay_' + Date.now(), date: new Date().toISOString(), ...payment });
      const totalPaid = db.invoices[idx].payments.reduce((s, p) => s + Number(p.amount), 0);
      db.invoices[idx].paid_amount = totalPaid;
      db.invoices[idx].status = totalPaid >= db.invoices[idx].amount ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
      saveDB(db);
      return true;
    }
    return false;
  },
  deleteInvoice: (invoiceId) => {
    let db = getDB();
    db.invoices = db.invoices?.filter(i => i.id !== invoiceId) || [];
    saveDB(db);
    return true;
  },

  // Notifications
  getNotifications: (userId) => {
    const db = getDB();
    return (db.notifications || []).filter(n => n.to === userId || n.to === 'all').sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  },
  addNotification: (data) => {
    let db = getDB();
    const note = { id: 'notif_' + Date.now(), read: false, created_at: new Date().toISOString(), ...data };
    if(!db.notifications) db.notifications = [];
    db.notifications.unshift(note);
    if (db.notifications.length > 100) db.notifications = db.notifications.slice(0, 100);
    saveDB(db);
    return note;
  },
  markNotificationRead: (notifId, userId) => {
    let db = getDB();
    const idx = db.notifications?.findIndex(n => n.id === notifId);
    if (idx > -1) { db.notifications[idx].read = true; saveDB(db); }
  },
  markAllRead: (userId) => {
    let db = getDB();
    (db.notifications || []).forEach(n => { if(n.to === userId || n.to === 'all') n.read = true; });
    saveDB(db);
  },

  // Queries / Support Tickets
  getQueries: (projectId) => {
    const db = getDB();
    if (projectId && projectId !== 'all') return db.queries?.filter(q => q.project_id === projectId) || [];
    return db.queries || [];
  },
  addQuery: (data) => {
    let db = getDB();
    const newQuery = {
      id: 'qry_' + Date.now(),
      status: 'open',
      priority: 'medium',
      created_at: new Date().toISOString(),
      replies: [],
      ...data
    };
    if (!db.queries) db.queries = [];
    db.queries.unshift(newQuery);
    // Notify admin
    adminApi.addNotification({
      to: 'U001',
      type: 'query',
      title: `New Client Query: ${newQuery.subject}`,
      message: `From ${newQuery.client_name} — ${newQuery.project_name || newQuery.project_id}`,
      icon: '❓'
    });
    saveDB(db);
    return newQuery;
  },
  addQueryReply: (queryId, reply) => {
    let db = getDB();
    const idx = db.queries?.findIndex(q => q.id === queryId);
    if (idx > -1) {
      if (!db.queries[idx].replies) db.queries[idx].replies = [];
      db.queries[idx].replies.push({
        id: 'rep_' + Date.now(),
        created_at: new Date().toISOString(),
        ...reply
      });
      // If status was open, mark in-progress
      if (db.queries[idx].status === 'open' && reply.from_role !== 'client') {
        db.queries[idx].status = 'in-progress';
      }
      saveDB(db);
      return true;
    }
    return false;
  },
  updateQueryStatus: (queryId, status, resolvedBy) => {
    let db = getDB();
    const idx = db.queries?.findIndex(q => q.id === queryId);
    if (idx > -1) {
      db.queries[idx].status = status;
      if (status === 'resolved') {
        db.queries[idx].resolved_at = new Date().toISOString();
        db.queries[idx].resolved_by = resolvedBy;
      }
      saveDB(db);
      return true;
    }
    return false;
  },
  deleteQuery: (queryId) => {
    let db = getDB();
    db.queries = db.queries?.filter(q => q.id !== queryId) || [];
    saveDB(db);
    return true;
  },

  // BIM Models
  getBIMModels: (projectId) => {
    const db = getDB();
    if (projectId && projectId !== 'all') return db.bim_models?.filter(m => m.project_id === projectId) || [];
    return db.bim_models || [];
  },
  addBIMModel: (data) => {
    let db = getDB();
    const model = { id: 'bim_' + Date.now(), created_at: new Date().toISOString(), elements: [], ...data };
    if (!db.bim_models) db.bim_models = [];
    db.bim_models.push(model);
    saveDB(db);
    return model;
  },
  updateBIMModel: (modelId, data) => {
    let db = getDB();
    const idx = db.bim_models?.findIndex(m => m.id === modelId);
    if (idx > -1) { db.bim_models[idx] = { ...db.bim_models[idx], ...data }; saveDB(db); return true; }
    return false;
  },
  deleteBIMModel: (modelId) => {
    let db = getDB();
    db.bim_models = db.bim_models?.filter(m => m.id !== modelId) || [];
    saveDB(db);
    return true;
  },
  addBIMElement: (modelId, element) => {
    let db = getDB();
    const idx = db.bim_models?.findIndex(m => m.id === modelId);
    if (idx > -1) {
      if (!db.bim_models[idx].elements) db.bim_models[idx].elements = [];
      db.bim_models[idx].elements.push({ id: 'el_' + Date.now(), ...element });
      saveDB(db);
      return true;
    }
    return false;
  },
  updateBIMElement: (modelId, elementId, data) => {
    let db = getDB();
    const mIdx = db.bim_models?.findIndex(m => m.id === modelId);
    if (mIdx > -1) {
      const eIdx = db.bim_models[mIdx].elements?.findIndex(e => e.id === elementId);
      if (eIdx > -1) { 
        const oldEl = db.bim_models[mIdx].elements[eIdx];
        db.bim_models[mIdx].elements[eIdx] = { ...oldEl, ...data }; 
        
        // Phase 3 USP: BIM -> Stage Progress Sync
        if (data.status === 'completed' && data.link_type === 'stage' && data.link_id) {
          const projectId = db.bim_models[mIdx].project_id;
          const stage = db.stages?.find(s => s.project_id === projectId && s.stage_name === data.link_id);
          if (stage) {
            // Auto-calculate new stage progress based on elements if multiple are linked, 
            // but for now, we just nudge it up or set to 100 if it's the main linked item.
            stage.completion_percentage = Math.min(100, (Number(stage.completion_percentage) || 0) + 5);
            stage.notes = `Progress nudged by BIM completion of ${data.name}`;
          }
        }
        
        saveDB(db); 
        return true; 
      }
    }
    return false;
  },
  deleteBIMElement: (modelId, elementId) => {
    let db = getDB();
    const idx = db.bim_models?.findIndex(m => m.id === modelId);
    if (idx > -1) { db.bim_models[idx].elements = db.bim_models[idx].elements?.filter(e => e.id !== elementId) || []; saveDB(db); }
    return true;
  },

  // Advanced KPI Analytics
  getKPIData: () => {
    const db = getDB();
    const projects = db.projects || [];
    const stages = db.stages || [];
    const costs = db.costs || [];
    const tasks = db.tasks || [];
    const attendance = db.attendance || [];
    const updates = db.updates || [];
    const logs = db.logs || [];
    const users = db.users || [];

    const kpi = projects.map(proj => {
      const projStages = stages.filter(s => s.project_id === proj.project_id);
      const projCosts = costs.filter(c => c.project_id === proj.project_id);
      const projTasks = tasks.filter(t => t.project_id === proj.project_id);
      const projAttendance = attendance.filter(a => a.project_id === proj.project_id);
      const projUpdates = updates.filter(u => u.project_id === proj.project_id);

      const totalBudget = projStages.reduce((s, st) => s + (st.stage_budget || 0), 0);
      const totalSpent = projStages.reduce((s, st) => s + (st.stage_spent || 0), 0);
      const totalWages = projAttendance.reduce((s, a) => s + (Number(a.total_wage) || 0), 0);
      const profitMargin = totalBudget - totalSpent - totalWages;

      const totalWeight = projStages.reduce((s, st) => s + st.weight, 0);
      const progress = totalWeight > 0 ? projStages.reduce((s, st) => s + (Number(st.completion_percentage) * st.weight), 0) / totalWeight : 0;

      const doneTasks = projTasks.filter(t => t.status === 'done').length;
      const overdueTasks = projTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length;

      const daysLeft = proj.end_date ? (new Date(proj.end_date) - new Date()) / (1000 * 60 * 60 * 24) : null;
      const totalDays = (proj.start_date && proj.end_date) ? (new Date(proj.end_date) - new Date(proj.start_date)) / (1000 * 60 * 60 * 24) : null;
      const timeElapsed = totalDays ? Math.min(100, ((totalDays - (daysLeft || 0)) / totalDays) * 100) : 0;
      const scheduleVariance = progress - timeElapsed; // positive = ahead, negative = behind

      const laborDays = projAttendance.reduce((s, a) => s + (Number(a.total_workers) || 0), 0);
      const lastUpdate = projUpdates.length ? Math.max(...projUpdates.map(u => new Date(u.date))) : null;
      const daysSinceUpdate = lastUpdate ? (new Date() - new Date(lastUpdate)) / (1000 * 60 * 60 * 24) : 999;

      // Phase 3 KPI Intelligence
      const riskLevel = scheduleVariance < -15 ? 'Critical' : scheduleVariance < -5 ? 'High' : 'Normal';
      const projectedDelay = scheduleVariance < 0 ? Math.abs(Math.round(scheduleVariance * 0.5)) : 0; // days projected

      return {
        project_id: proj.project_id,
        project_name: proj.project_name,
        location: proj.location,
        totalBudget, totalSpent, totalWages, profitMargin,
        progress: Math.round(progress * 10) / 10,
        timeElapsed: Math.round(timeElapsed),
        scheduleVariance: Math.round(scheduleVariance * 10) / 10,
        daysLeft: daysLeft ? Math.floor(daysLeft) : null,
        doneTasks, overdueTasks, totalTasks: projTasks.length,
        taskRate: projTasks.length ? Math.round((doneTasks / projTasks.length) * 100) : 0,
        laborDays, updateCount: projUpdates.length, daysSinceUpdate: Math.floor(daysSinceUpdate),
        costEfficiency: totalBudget > 0 ? Math.round(((totalBudget - totalSpent) / totalBudget) * 100) : 0,
        riskLevel,
        projectedDelay
      };
    });

    // Engineer performance
    const engineerPerf = users.filter(u => ['engineer','supervisor','contractor'].includes(u.role)).map(u => {
      const userCosts = costs.filter(c => c.added_by === u.user_id).length;
      const userUpdates = updates.filter(up => up.added_by === u.user_id).length;
      const userLogs = logs.filter(l => l.added_by === u.user_id).length;
      const userTasks = tasks.filter(t => t.assignee_role === u.role && t.status === 'done').length;
      const activityScore = (userCosts * 3) + (userUpdates * 2) + (userLogs * 2) + (userTasks * 4);
      return { user_id: u.user_id, name: u.name, role: u.role, avatar: u.avatar, userCosts, userUpdates, userLogs, userTasks, activityScore };
    }).sort((a, b) => b.activityScore - a.activityScore);

    // Phase 4: Role-based data scrubbing for KPIs
    const user = adminApi.getCurrentUser();
    const isRestricted = user && ['architect', 'contractor', 'supervisor'].includes(user.role);

    return { 
      projects: kpi.map(p => isRestricted ? { ...p, totalBudget: 0, totalSpent: 0, totalWages: 0, profitMargin: 0, costEfficiency: 0 } : p), 
      engineerPerf 
    };
  },

  // RBAC — Custom permission management
  grantCustomPermission: (userId, feature) => {
    let db = getDB();
    const idx = db.users?.findIndex(u => u.user_id === userId);
    if (idx > -1) {
      if (!db.users[idx].custom_permissions) db.users[idx].custom_permissions = [];
      if (!db.users[idx].custom_permissions.includes(feature)) db.users[idx].custom_permissions.push(feature);
      saveDB(db);
      return true;
    }
    return false;
  },
  revokeCustomPermission: (userId, feature) => {
    let db = getDB();
    const idx = db.users?.findIndex(u => u.user_id === userId);
    if (idx > -1) {
      db.users[idx].custom_permissions = (db.users[idx].custom_permissions || []).filter(f => f !== feature);
      saveDB(db);
      return true;
    }
    return false;
  },
  setProjectAccess: (userId, projectIds) => {
    let db = getDB();
    const idx = db.users?.findIndex(u => u.user_id === userId);
    if (idx > -1) { db.users[idx].project_ids = projectIds; saveDB(db); return true; }
    return false;
  },
  setAccessExpiry: (userId, expiryDate) => {
    let db = getDB();
    const idx = db.users?.findIndex(u => u.user_id === userId);
    if (idx > -1) { db.users[idx].access_expires = expiryDate; saveDB(db); return true; }
    return false;
  },

  // Phase 4.1: Live Feed & Warranty Management
  getLiveFeed: (projectId) => {
    const db = getDB();
    return db.live_feeds?.find(f => f.project_id === projectId) || { project_id: projectId, embed_url: '', status: 'offline', last_snapshot: null };
  },
  updateLiveFeed: (projectId, data) => {
    let db = getDB();
    if (!db.live_feeds) db.live_feeds = [];
    const idx = db.live_feeds.findIndex(f => f.project_id === projectId);
    if (idx > -1) db.live_feeds[idx] = { ...db.live_feeds[idx], ...data };
    else db.live_feeds.push({ project_id: projectId, ...data });
    saveDB(db);
    return true;
  },
  getWarranties: (projectId) => {
    const db = getDB();
    if (projectId && projectId !== 'all') return db.warranties?.filter(w => w.project_id === projectId) || [];
    return db.warranties || [];
  },
  addWarranty: (data) => {
    let db = getDB();
    const w = { id: 'w_' + Date.now(), ...data };
    if (!db.warranties) db.warranties = [];
    db.warranties.push(w);
    saveDB(db);
    return w;
  },
  deleteWarranty: (id) => {
    let db = getDB();
    db.warranties = db.warranties?.filter(w => w.id !== id) || [];
    saveDB(db);
    return true;
  }
};




