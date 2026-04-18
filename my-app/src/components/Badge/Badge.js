import React from 'react';
import './Badge.css';

const Badge = ({ variant = 'primary', label, size = 'medium', ...props }) => {
  return (
    <span className={`badge badge-${variant} badge-${size}`} {...props}>
      {label}
    </span>
  );
};

export default Badge;
