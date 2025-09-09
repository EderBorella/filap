import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.scss';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="language-switcher">
      <button 
        className="language-switcher__current"
        aria-label="Change language"
        title="Change language"
      >
        <span className="language-switcher__flag">{currentLanguage.flag}</span>
        <span className="language-switcher__code">{currentLanguage.code.toUpperCase()}</span>
      </button>
      
      <div className="language-switcher__dropdown">
        {languages.map((language) => (
          <button
            key={language.code}
            className={`language-switcher__option ${language.code === i18n.language ? 'language-switcher__option--active' : ''}`}
            onClick={() => handleLanguageChange(language.code)}
            aria-label={`Switch to ${language.name}`}
          >
            <span className="language-switcher__option-flag">{language.flag}</span>
            <span className="language-switcher__option-name">{language.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;