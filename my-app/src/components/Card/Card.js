import React from 'react';
import './Card.css';

const Card = ({ title, description, icon: Icon, children, ...props }) => {
  return (
    <div className="card" {...props}>
      <div className="card-header">
        {Icon && <Icon className="card-icon" />}
        <h3>{title}</h3>
      </div>
      <p className="card-description">{description}</p>
      {children && <div className="card-content">{children}</div>}
    </div>
  );
};

export default Card;
