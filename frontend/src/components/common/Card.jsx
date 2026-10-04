import React from 'react';
import './Common.css';

const Card = ({ title, value, subtitle, colorClass, children }) => {
  return (
    <div className={`stat-card ${colorClass || ''}`}>
      {title && <div className="card-title">{title}</div>}
      {value && <div className="card-value">{value}</div>}
      {subtitle && <div className="card-subtitle">{subtitle}</div>}
      {children}
    </div>
  );
};
export default Card;
