import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './FloatingInput.scss';

export interface FloatingInputProps {
  children: React.ReactNode;
  buttonText: string;
  buttonIcon?: React.ReactNode;
  className?: string;
  title?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  children,
  buttonText,
  buttonIcon,
  className = '',
  title
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  return (
    <div className={`floating-input ${isExpanded ? 'floating-input--expanded' : 'floating-input--collapsed'} ${className}`}>
      {/* Collapsed Button */}
      {!isExpanded && (
        <button
          className="floating-input__toggle-btn"
          onClick={handleToggle}
          aria-label={buttonText}
        >
          {buttonIcon && <span className="floating-input__icon">{buttonIcon}</span>}
          <span className="floating-input__text">{buttonText}</span>
        </button>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="floating-input__content">
          {/* Header with Title and Close Button */}
          <div className="floating-input__header">
            {title && (
              <h3 className="floating-input__title">
                {title}
              </h3>
            )}
            <button
              className="floating-input__close-btn"
              onClick={handleClose}
              aria-label={t('common.close')}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Input Content */}
          <div className="floating-input__inner">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingInput;