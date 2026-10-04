import React from 'react';
import './Common.css';

const ErrorState = ({ message, onRetry }) => (
  <div className="error-state">
    <div className="error-icon">⚠️</div>
    <div className="error-message">{message || 'An error occurred while loading data.'}</div>
    {onRetry && <button className="btn btn-primary mt-3" onClick={onRetry}>Retry</button>}
  </div>
);
export default ErrorState;
