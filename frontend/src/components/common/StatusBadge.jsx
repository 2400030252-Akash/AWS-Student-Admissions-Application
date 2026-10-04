import React from 'react';
import './Common.css';

const StatusBadge = ({ status }) => {
  const getStatusClass = (s) => {
    switch (s?.toUpperCase()) {
      case 'APPROVED': return 'badge-success';
      case 'REJECTED': return 'badge-error';
      case 'UNDER_REVIEW': return 'badge-info';
      case 'PENDING': default: return 'badge-warning';
    }
  };
  return <span className={`badge ${getStatusClass(status)}`}>{status}</span>;
};
export default StatusBadge;
