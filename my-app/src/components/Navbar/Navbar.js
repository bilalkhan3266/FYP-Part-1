import React, { useState } from 'react';
import './Navbar.css';
import { FiMenu, FiX, FiHome, FiSettings, FiUser } from 'react-icons/fi';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <FiHome className="logo-icon" />
          <span>ComponentLib</span>
        </div>

        <button className="navbar-toggle" onClick={toggleMenu}>
          {isOpen ? <FiX /> : <FiMenu />}
        </button>

        <ul className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <li>
            <a href="#home" className="navbar-link">
              <FiHome /> Home
            </a>
          </li>
          <li>
            <a href="#components" className="navbar-link">
              <FiSettings /> Components
            </a>
          </li>
          <li>
            <a href="#profile" className="navbar-link">
              <FiUser /> Profile
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
