import dummyData from '../data/dummy_data.json';

const DB_KEY = 'ludarp_db';

// Initialize the database in localStorage if it doesn't exist
export const initDB = () => {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify(dummyData));
  }
};

const getDB = () => {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY));
  } catch (e) {
    return null;
  }
};

const saveDB = (db) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const api = {
  login: (projectId, password) => {
    try {
      const db = getDB();
      if (!db) return null;
      const project = db.projects.find(p => p.project_id === projectId && p.password === password);
      if (project) {
        const { password: _, ...projectWithoutPassword } = project;
        return { success: true, data: projectWithoutPassword };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (e) {
      return null;
    }
  },

  getProject: (projectId) => {
    try {
      const db = getDB();
      const project = db.projects.find(p => p.project_id === projectId);
      return project ? { success: true, data: project } : { success: false, error: 'Project not found' };
    } catch (e) {
      return null;
    }
  },

  getCosts: (projectId) => {
    try {
      const db = getDB();
      const costs = db.costs.filter(c => c.project_id === projectId);
      let total_spent = 0;
      const breakdown = { Materials: 0, Labor: 0, Miscellaneous: 0 };
      
      costs.forEach(c => {
        total_spent += Number(c.amount);
        if (breakdown[c.category] !== undefined) {
          breakdown[c.category] += Number(c.amount);
        } else {
          breakdown[c.category] = Number(c.amount);
        }
      });
      return { success: true, data: { total_spent, breakdown, rows: costs } };
    } catch (e) {
      return null;
    }
  },

  getUpdates: (projectId) => {
    try {
      const db = getDB();
      let updates = db.updates.filter(u => u.project_id === projectId);
      updates.sort((a, b) => new Date(b.date) - new Date(a.date));
      return { success: true, data: updates };
    } catch (e) {
      return null;
    }
  },

  getStages: (projectId) => {
    try {
      const db = getDB();
      const stages = db.stages.filter(s => s.project_id === projectId);
      return { success: true, data: stages };
    } catch (e) {
      return null;
    }
  },

  getDocuments: (projectId) => {
    try {
      const db = getDB();
      const documents = db.documents.filter(d => d.project_id === projectId);
      return { success: true, data: documents };
    } catch (e) {
      return null;
    }
  },

  addCost: (projectId, { category, amount, date }) => {
    try {
      const db = getDB();
      const newCost = {
        id: 'c_' + Date.now().toString(),
        project_id: projectId,
        category,
        amount: Number(amount),
        date
      };
      db.costs.push(newCost);
      saveDB(db);
      return { success: true, data: newCost };
    } catch (e) {
      return null;
    }
  },

  addUpdate: (projectId, { description, image_url, date }) => {
    try {
      const db = getDB();
      const newUpdate = {
        id: 'u_' + Date.now().toString(),
        project_id: projectId,
        description,
        image_url,
        date
      };
      db.updates.push(newUpdate);
      saveDB(db);
      return { success: true, data: newUpdate };
    } catch (e) {
      return null;
    }
  },

  updateStage: (projectId, stageName, completionPercentage) => {
    try {
      const db = getDB();
      const stage = db.stages.find(s => s.project_id === projectId && s.stage_name === stageName);
      if (stage) {
        stage.completion_percentage = Number(completionPercentage);
        saveDB(db);
        return { success: true };
      }
      return { success: false, error: 'Stage not found' };
    } catch (e) {
      return null;
    }
  },

  updateProjectProgress: (projectId, progress) => {
    try {
      const db = getDB();
      const project = db.projects.find(p => p.project_id === projectId);
      if (project) {
        project.progress = Math.min(100, Math.max(0, Number(progress)));
        
        // Let's deduce an overall stage automatically if we liked, 
        // but for now just update the progress field directly
        saveDB(db);
        return { success: true };
      }
      return { success: false, error: 'Project not found' };
    } catch (e) {
      return null;
    }
  }
};
