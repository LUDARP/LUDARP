const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your actual Spreadsheet ID

function doGet(e) {
  const action = e.parameter.action;
  let result = null;

  try {
    switch (action) {
      case 'login':
        result = handleLogin(e.parameter.project_id, e.parameter.password);
        break;
      case 'getProjectDetails':
        result = getProjectDetails(e.parameter.project_id);
        break;
      case 'getCosts':
        result = getCosts(e.parameter.project_id);
        break;
      case 'getUpdates':
        result = getUpdates(e.parameter.project_id);
        break;
      case 'getStages':
        result = getStages(e.parameter.project_id);
        break;
      case 'getDocuments':
        result = getDocuments(e.parameter.project_id);
        break;
      default:
        return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function handleLogin(projectId, password) {
  const projects = getSheetData('Projects');
  const project = projects.find(p => p.project_id == projectId && p.password == password);
  
  if (project) {
    delete project.password; // Never return password
    return { success: true, data: project };
  }
  return { success: false, error: 'Invalid credentials' };
}

function getProjectDetails(projectId) {
  const projects = getSheetData('Projects');
  const project = projects.find(p => p.project_id == projectId);
  if (project) {
    delete project.password;
    return { success: true, data: project };
  }
  return { success: false, error: 'Project not found' };
}

function getCosts(projectId) {
  const costs = getSheetData('Costs').filter(c => c.project_id == projectId);
  let total_spent = 0;
  const breakdown = {};

  costs.forEach(cost => {
    const amount = parseFloat(cost.amount) || 0;
    total_spent += amount;
    
    if (!breakdown[cost.category]) {
      breakdown[cost.category] = 0;
    }
    breakdown[cost.category] += amount;
  });

  return { success: true, data: { costs, total_spent, breakdown } };
}

function getUpdates(projectId) {
  let updates = getSheetData('Updates').filter(u => u.project_id == projectId);
  // Sort newest first by date
  updates.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { success: true, data: updates };
}

function getStages(projectId) {
  const stages = getSheetData('Stages').filter(s => s.project_id == projectId);
  return { success: true, data: stages };
}

function getDocuments(projectId) {
  const docs = getSheetData('Documents').filter(d => d.project_id == projectId);
  return { success: true, data: docs };
}

function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  return sheetToObjects(data);
}

function sheetToObjects(data) {
  if (data.length === 0) return [];
  const headers = data[0];
  const objects = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    objects.push(obj);
  }
  
  return objects;
}
