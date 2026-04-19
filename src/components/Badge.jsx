import React from 'react';

const Badge = ({ label, variant }) => {
  let mappedVariant = 'gray'; // default
  
  if (variant === 'admin' || variant === 'danger' || variant === 'critical') mappedVariant = 'danger';
  if (variant === 'engineer' || variant === 'primary') mappedVariant = 'accent';
  if (variant === 'architect' || variant === 'purple') mappedVariant = 'purple';
  if (variant === 'supervisor' || variant === 'success' || variant === 'good') mappedVariant = 'success';
  if (variant === 'warning') mappedVariant = 'warning';
  
  return (
    <span className={`badge badge-${mappedVariant}`}>{label}</span>
  );
};

export default Badge;
