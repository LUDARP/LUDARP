/**
 * LUDARP CONSTRUCTION PLATFORM - BACKEND API (v1.0)
 * Description: Connects Google Sheets to the React Frontend.
 * Actions: Login, Create/Read Projects, Users, Stages, Costs, Updates, Docs, Logs.
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // SET THIS

function doGet(e) {
  const action = e.parameter.action;
  const project_id = e.parameter.project_id;
  const user_id = e.parameter.user_id;

  try {
    switch (action) {
      case 'getProjects': return respond(getData('Projects'));
      case 'getUsers': return respond(getData('Users'));
      case 'getStages': return respond(getData('Stages').filter(s => s.project_id === project_id));
      case 'getCosts': return respond(getData('Costs').filter(c => c.project_id === project_id));
      case 'getUpdates': return respond(getData('Updates').filter(u => u.project_id === project_id));
      case 'getDocuments': return respond(getData('Documents').filter(d => d.project_id === project_id));
      case 'getLogs': return respond(getData('Logs').filter(l => l.project_id === project_id));
      default: return respond({ error: 'Action not found' });
    }
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

function doPost(e) {
  const action = e.parameter.action;
  const data = JSON.parse(e.postData.contents);

  try {
    switch (action) {
      case 'addProject': return respond(addRow('Projects', data));
      case 'addUser': return respond(addRow('Users', data));
      case 'addCost': return respond(addRow('Costs', data));
      case 'addUpdate': return respond(addRow('Updates', data));
      case 'addDocument': return respond(addRow('Documents', data));
      case 'addLog': return respond(addRow('Logs', data));
      case 'updateStage': return respond(updateStageProgress(data.project_id, data.stage_name, data.pct));
      default: return respond({ error: 'Post action not found' });
    }
  } catch (err) {
    return respond({ error: err.toString() });
  }
}

// Helper Functions
function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function getData(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function addRow(sheetName, data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  const headers = sheet.getDataRange().getValues()[0];
  const newRow = headers.map(h => data[h] || "");
  sheet.appendRow(newRow);
  return { success: true };
}

function updateStageProgress(pid, sname, pct) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Stages');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == pid && data[i][1] == sname) {
      sheet.getRange(i + 1, 3).setValue(pct);
      return { success: true };
    }
  }
  return { success: false, error: 'Stage not found' };
}
