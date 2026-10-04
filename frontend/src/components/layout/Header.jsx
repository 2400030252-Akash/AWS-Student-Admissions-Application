import React from 'react';
import './Header.css';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="top-header">
      <button className="menu-btn" onClick={toggleSidebar}>
        ☰
      </button>
      <div className="header-title">Admissions Portal</div>
      <div className="header-user">
        <span className="user-avatar">👤</span>
        <span>Admin</span>
      </div>
    </header>
  );
};
export default Header;
