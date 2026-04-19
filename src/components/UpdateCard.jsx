import React from 'react';

const UpdateCard = ({ update }) => {
  return (
    <div className="update-card">
      {update.image_url && (
        <img 
          src={update.image_url} 
          alt="Site update" 
          className="update-image" 
        />
      )}
      <div className="update-body">
        <div className="update-date">
          {new Date(update.date).toLocaleDateString()}
        </div>
        <p className="update-description">
          {update.description}
        </p>
      </div>
    </div>
  );
};

export default UpdateCard;
