import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Settings } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <FileText size={24} />
        Documentation Improver
      </Link>
      
      <nav className="header-nav">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Upload Document
        </Link>
        <Link 
          to="/models" 
          className={`nav-link ${location.pathname === '/models' ? 'active' : ''}`}
        >
          <Settings size={16} />
          Models
        </Link>
      </nav>
    </header>
  );
};

export default Header; 