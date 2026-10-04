import React from 'react';
import './Common.css';

const Toast = ({ message, type = 'info', onClose }) => {
  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button onClick={onClose} className="toast-close">×</button>
    </div>
  );
};
export default Toast;
