import React from 'react';
import './Button.css';

const Button = ({
  variant = 'primary',
  children,
  icon: Icon,
  disabled = false,
  onClick,
  size = 'medium',
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${disabled ? 'btn-disabled' : ''}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon className="btn-icon" />}
      <span>{children}</span>
    </button>
  );
};

export default Button;
