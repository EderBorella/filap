import React from 'react';
import './NavBar.scss';

interface MenuItem {
  label: string;
  href: string;
  active?: boolean;
}

const NavBar: React.FC = () => {
  const menuItems: MenuItem[] = [
    { 
      label: 'Home', 
      href: '/',
      active: true 
    },
    { 
      label: 'My Queues', 
      href: '/queues' 
    },
    { 
      label: 'Contact', 
      href: '/contact' 
    }
  ];

  return (
    <nav className="nav">
      <div className="nav__container">
        <a href="/" className="nav__brand">
          Filap
        </a>
        
        <div className="nav__links">
          {menuItems.map((item, index) => (
            <a 
              key={index}
              href={item.href}
              className={`nav__link ${item.active ? 'nav__link--active' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;