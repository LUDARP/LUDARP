import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          {title}
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
