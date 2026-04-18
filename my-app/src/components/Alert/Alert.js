import React, { useState } from 'react';
import './Alert.css';
import { FiX, FiCheckCircle, FiInfo, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';

const Alert = ({ type = 'info', message, closeable = true, title }) => {
  const [isVisible, setIsVisible] = useState(true);

  const iconMap = {
    success: FiCheckCircle,
    info: FiInfo,
    warning: FiAlertTriangle,
    error: FiAlertCircle,
  };

  const Icon = iconMap[type];

  if (!isVisible) return null;

  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-content">
        {Icon && <Icon className="alert-icon" />}
        <div className="alert-text">
          {title && <div className="alert-title">{title}</div>}
          <div className="alert-message">{message}</div>
        </div>
      </div>
      {closeable && (
        <button
          className="alert-close"
          onClick={() => setIsVisible(false)}
          aria-label="Close alert"
        >
          <FiX />
        </button>
      )}
    </div>
  );
};

export default Alert;
