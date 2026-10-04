import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, closeSidebar, currentPath }) => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/students', label: 'Students', icon: '🎓' },
    { path: '/students/new', label: 'New Student', icon: '➕' },
    { path: '/applications', label: 'Applications', icon: '📝' },
    { path: '/applications/new', label: 'New Application', icon: '✨' },
    { path: '/metrics', label: 'Metrics', icon: '📈' },
    { path: '/system-health', label: 'System Health', icon: '❤️' }
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={closeSidebar}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Aurora Portal</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${currentPath === item.path ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};
export default Sidebar;
