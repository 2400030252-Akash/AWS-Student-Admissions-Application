import React from 'react';
import './Common.css';

const EmptyState = ({ icon = '📭', message, action }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <div className="empty-message">{message}</div>
    {action && <div className="empty-action">{action}</div>}
  </div>
);
export default EmptyState;
