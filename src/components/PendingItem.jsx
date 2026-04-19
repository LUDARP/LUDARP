import React from 'react';

const PendingItem = ({ item }) => {
  let dotClass = 'dot-low';
  let badgeClass = 'badge-gray';
  
  if (item.priority === 'high') {
    dotClass = 'dot-high';
    badgeClass = 'badge-danger';
  } else if (item.priority === 'medium') {
    dotClass = 'dot-medium';
    badgeClass = 'badge-warning';
  }

  const formattedDate = new Date(item.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="pending-item">
      <div className="pending-left">
        <div className={`priority-dot ${dotClass}`}></div>
        <div>
          <div className="pending-title">{item.title}</div>
          <div className="pending-due">Due: {formattedDate}</div>
        </div>
      </div>
      <div>
        <span className={`badge ${badgeClass}`}>{item.priority.toUpperCase()}</span>
      </div>
    </div>
  );
};

export default PendingItem;
