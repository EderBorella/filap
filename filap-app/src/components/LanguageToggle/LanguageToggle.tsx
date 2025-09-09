import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageToggle.scss';

export interface LanguageToggleProps {
  position?: 'fixed' | 'static';
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  position = 'fixed', 
  className = '', 
  size = 'medium' 
}) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  const otherLanguage = languages.find(lang => lang.code !== i18n.language) || languages[1];

  const handleLanguageToggle = () => {
    i18n.changeLanguage(otherLanguage.code);
  };

  return (
    <button
      className={`language-toggle language-toggle--${position} language-toggle--${size} ${className}`}
      onClick={handleLanguageToggle}
      aria-label={`Switch to ${otherLanguage.name}`}
      title={`Switch to ${otherLanguage.name}`}
    >
      <span className="language-toggle__current">
        <span className="language-toggle__flag">{currentLanguage.flag}</span>
        <span className="language-toggle__code">{currentLanguage.code.toUpperCase()}</span>
      </span>
      
      <svg 
        className="language-toggle__arrow" 
        width="12" 
        height="12" 
        viewBox="0 0 12 12" 
        fill="currentColor"
      >
        <path d="M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z" />
      </svg>
      
      <span className="language-toggle__next">
        <span className="language-toggle__flag">{otherLanguage.flag}</span>
        <span className="language-toggle__code">{otherLanguage.code.toUpperCase()}</span>
      </span>
    </button>
  );
};

export default LanguageToggle;