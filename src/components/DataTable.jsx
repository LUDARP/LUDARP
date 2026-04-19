import React, { useState } from 'react';

const DataTable = ({ columns, data, onDelete, onEdit, deleteAllowed = true }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(row => {
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <input 
          type="text" 
          placeholder="Search..." 
          className="table-search" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {filteredData.length} records
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {columns.map(col => <th key={col.key || col.label}>{col.label}</th>)}
              {(onEdit || onDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, idx) => (
                <tr key={row.id || row.user_id || row.project_id || idx}>
                  {columns.map(col => (
                    <td key={col.key || col.label}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td>
                      {onEdit && (
                        <button className="action-btn" onClick={() => onEdit(row)} title="Edit">✏️</button>
                      )}
                      {(onDelete && deleteAllowed) && (
                        <button className="action-btn delete" onClick={() => {
                          if(window.confirm('Are you sure? This cannot be undone.')) {
                            onDelete(row.id || row.user_id || row.project_id);
                          }
                        }} title="Delete">🗑️</button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
