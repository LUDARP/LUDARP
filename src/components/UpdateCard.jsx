import React from 'react';

const UpdateCard = ({ update }) => {
  return (
    <div className="update-card">
      <div className="update-img-container">
        {update.image_url ? (
          <img src={update.image_url} alt="Site update" className="update-img" />
        ) : (
          <div style={{ padding: '20px', color: 'var(--muted)', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No image attached
          </div>
        )}
      </div>
      <div className="update-body">
        <div className="update-header">
          <span className="badge badge-accent" style={{ fontSize: '10px' }}>{update.stage_name}</span>
          <span className="update-date">
             {new Date(update.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <p className="update-desc">{update.description}</p>
      </div>
    </div>
  );
};

export default UpdateCard;
