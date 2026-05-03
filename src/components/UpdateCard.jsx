import React from 'react';

const UpdateCard = ({ update }) => {
  return (
    <div className="update-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {update.image_url && update.image_after_url ? (
        <div style={{ display: 'flex', height: '200px' }}>
           <div style={{ flex: 1, position: 'relative' }}>
             <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>Before</span>
             <img src={update.image_url} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
           </div>
           <div style={{ flex: 1, position: 'relative' }}>
             <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>After</span>
             <img src={update.image_after_url} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
           </div>
        </div>
      ) : (
        <div className="update-img-container" style={{ height: '200px' }}>
          {update.image_url || update.image_after_url ? (
            <img src={update.image_url || update.image_after_url} alt="Site update" className="update-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border)' }}>
              No visual attached
            </div>
          )}
        </div>
      )}
      <div className="update-body" style={{ padding: '16px' }}>
        <div className="update-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="badge badge-accent" style={{ fontSize: '10px' }}>{update.stage_name}</span>
          <span className="update-date" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
             {new Date(update.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        {update.tags && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {update.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
              <span key={tag} style={{ fontSize: '11px', color: 'var(--accent)', background: 'var(--info-light)', padding: '2px 6px', borderRadius: '4px' }}>{tag}</span>
            ))}
          </div>
        )}
        <p className="update-desc" style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>{update.description}</p>
      </div>
    </div>
  );
};

export default UpdateCard;
