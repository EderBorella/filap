import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import './NavBar.scss';

interface MenuItem {
  label: string;
  href: string;
  active?: boolean;
}

const NavBar: React.FC = () => {
  const { t } = useTranslation();
  
  const menuItems: MenuItem[] = [
    { 
      label: t('navigation.home'), 
      href: '/',
      active: true 
    },
    { 
      label: t('navigation.contact'), 
      href: '/contact' 
    }
  ];

  return (
    <nav className="nav">
      <div className="nav__container">
        <a href="/" className="nav__brand">
          {t('appName')}
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

        <div className="nav__actions">
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;