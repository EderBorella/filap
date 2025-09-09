import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StorageService } from '../../services';
import { useToast } from '../Toast';
import './QueueHeader.scss';

export type SortOption = 'votes' | 'newest';

export interface QueueHeaderProps {
  queueId: string;
  queueName?: string;
  expiresAt: string;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const QueueHeader: React.FC<QueueHeaderProps> = ({
  queueId,
  queueName,
  expiresAt,
  currentSort,
  onSortChange
}) => {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Collapsed by default on mobile
  const { showSuccess, showError } = useToast();

  // Check if user is host
  const isHost = StorageService.isHost(queueId);

  // Update countdown timer
  useEffect(() => {
    const updateCountdown = (): void => {
      const now = new Date();
      const expiryDate = new Date(expiresAt);
      const timeDiff = expiryDate.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setTimeRemaining(t('queue.expired'));
        setIsExpiringSoon(true);
        return;
      }

      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      // Format time string
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setTimeRemaining(timeString);

      // Show warning when less than 1 hour remaining
      setIsExpiringSoon(timeDiff < 60 * 60 * 1000);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const copyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(queueId);
      showSuccess(t('toast.queueIdCopied'));
      setShowCopyTooltip(true);
      setTimeout(() => setShowCopyTooltip(false), 2000);
    } catch (error) {
      showError(t('toast.errors.copyToClipboardFailed'));
    }
  };

  const handleSortChange = (sort: SortOption): void => {
    if (isHost && sort !== currentSort) {
      onSortChange(sort);
    }
  };

  const toggleCollapse = (): void => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`queue-header ${isCollapsed ? 'queue-header--collapsed' : 'queue-header--expanded'}`}>
      {/* Mobile Toggle Button */}
      <button 
        className="queue-header__toggle-btn"
        onClick={toggleCollapse}
        aria-label={isCollapsed ? t('queue.expandHeader') : t('queue.collapseHeader')}
        aria-expanded={!isCollapsed}
      >
        <h1 className="queue-header__name queue-header__name--compact">
          {queueName || t('queue.liveSession')}
        </h1>
        <svg 
          className={`queue-header__toggle-arrow ${isCollapsed ? '' : 'queue-header__toggle-arrow--expanded'}`}
          width="20" 
          height="20" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="queue-header__content">
        <div className="queue-header__info">
          {/* Queue Name (Desktop) */}
          <h1 className="queue-header__name queue-header__name--desktop">
            {queueName || t('queue.liveSession')}
          </h1>

        {/* Queue ID with Copy Functionality */}
        <div className="queue-header__id-container">
          <button
            className="queue-header__id"
            onClick={copyToClipboard}
            title={t('queue.copyQueueId')}
            aria-label={t('queue.copyQueueId')}
          >
            <code className="queue-header__id-text">{queueId}</code>
            <svg 
              className="queue-header__copy-icon" 
              width="16" 
              height="16" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v6h2.586l-2.293 2.293A1 1 0 005.707 14.707L8 12.414V5a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-3v2a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h1V5z" />
            </svg>
          </button>

          <button
            className="queue-header__share"
            onClick={copyToClipboard}
            title={t('queue.shareQueueId')}
            aria-label={t('queue.shareQueueId')}
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </button>
          
          {showCopyTooltip && (
            <div className="queue-header__tooltip">{t('queue.copied')}</div>
          )}
        </div>

        {/* Expiry Countdown */}
        <div className={`queue-header__expiry ${isExpiringSoon ? 'queue-header__expiry--warning' : ''}`}>
          {t('queue.expiresIn', { time: timeRemaining })}
        </div>
      </div>

      {/* Host Control Bar - Only shown for hosts */}
      {isHost && (
        <div className="queue-header__controls">
          <div className="queue-header__host-badge">
            <span className="queue-header__badge-icon">👑</span>
            {t('queue.hostMode')}
          </div>

          <div className="queue-header__sort-toggles">
            <span className="queue-header__sort-label">{t('queue.sortBy')}</span>
            
            <div className="queue-header__toggle-group">
              <button
                className={`queue-header__toggle ${currentSort === 'votes' ? 'queue-header__toggle--active' : ''}`}
                onClick={() => handleSortChange('votes')}
                type="button"
              >
                {t('queue.mostVotes')}
              </button>
              
              <button
                className={`queue-header__toggle ${currentSort === 'newest' ? 'queue-header__toggle--active' : ''}`}
                onClick={() => handleSortChange('newest')}
                type="button"
              >
                {t('queue.newest')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default QueueHeader;