import React from 'react';

const ContactCard = ({ contact }) => {
  let colorClass = 'blue';
  if (contact.role.toLowerCase().includes('architect')) colorClass = 'purple';
  if (contact.role.toLowerCase().includes('supervisor')) colorClass = 'green';

  return (
    <div className="contact-card">
      <div className={`avatar ${colorClass}`}>{contact.avatar}</div>
      <div className="contact-info">
        <div className="contact-role">{contact.role}</div>
        <div className="contact-name">{contact.name}</div>
        <div className="contact-detail">📞 {contact.phone}</div>
        <div className="contact-detail">✉️ {contact.email}</div>
      </div>
    </div>
  );
};

export default ContactCard;
