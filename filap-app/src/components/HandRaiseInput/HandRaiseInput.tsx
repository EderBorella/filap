import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { HandRaisesService } from '../../api/services/HandRaisesService';
import { StorageService } from '../../services';
import { useToast } from '../Toast';
import './HandRaiseInput.scss';

export interface HandRaiseInputProps {
  queueId: string;
}

const HandRaiseInput: React.FC<HandRaiseInputProps> = ({ queueId }) => {
  const { t } = useTranslation();
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const { showError, showSuccess } = useToast();

  // Get user token
  const userToken = StorageService.getUserToken(queueId);

  // Check user's current position and hand raise status
  const checkUserPosition = useCallback(async () => {
    if (!userToken) return;

    try {
      const response = await HandRaisesService.getApiQueuesUserPosition(queueId, userToken);
      setUserPosition(response.position || null);
      setHasRaisedHand(response.has_raised_hand || false);
    } catch (error) {
      console.error('Error checking user position:', error);
    }
  }, [queueId, userToken]);

  // Handle raising/lowering hand
  const handleRaiseHand = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userToken) {
      showError(t('toast.errors.userTokenRequired'));
      return;
    }

    if (!hasRaisedHand && (!userName.trim() || userName.trim().length > 100)) {
      showError(t('handRaise.nameRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await HandRaisesService.postApiQueuesHandraise(queueId, {
        user_token: userToken,
        user_name: userName.trim()
      });

      if (response) {
        // Hand was raised
        setHasRaisedHand(true);
        showSuccess(t('handRaise.handRaised'));
        // Position will be updated via SSE or polling
        checkUserPosition();
      } else {
        // Hand was lowered
        setHasRaisedHand(false);
        setUserPosition(null);
        showSuccess(t('handRaise.handLowered'));
      }
    } catch (error) {
      console.error('Error toggling hand raise:', error);
      showError(t('toast.errors.handRaiseFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [queueId, userToken, userName, hasRaisedHand, showError, showSuccess, checkUserPosition]);

  // Load saved name from localStorage
  useEffect(() => {
    const savedName = StorageService.getUserName(queueId);
    if (savedName) {
      setUserName(savedName);
    }
  }, [queueId]);

  // Save name to localStorage when it changes
  useEffect(() => {
    if (userName.trim()) {
      StorageService.setUserName(queueId, userName.trim());
    }
  }, [queueId, userName]);

  // Check position on mount and set up polling
  useEffect(() => {
    checkUserPosition();

    // Poll for position updates every 10 seconds as backup to SSE
    const interval = setInterval(checkUserPosition, 10000);

    return () => clearInterval(interval);
  }, [checkUserPosition]);

  return (
    <div className="hand-raise-input">
      <form onSubmit={handleRaiseHand} className="hand-raise-input__form">
        {!hasRaisedHand && (
          <div className="hand-raise-input__field">
            <label htmlFor="userName" className="hand-raise-input__label">
              {t('handRaise.yourName')} <span className="hand-raise-input__required">*</span>
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={t('handRaise.namePlaceholder')}
              className="hand-raise-input__input"
              maxLength={100}
              required
              disabled={isSubmitting}
            />
            <div className="hand-raise-input__help">
              {t('handRaise.nameHelp')}
            </div>
          </div>
        )}

        {hasRaisedHand && userPosition && (
          <div className="hand-raise-input__status">
            <div className="hand-raise-input__status-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12-4c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
              </svg>
            </div>
            <div className="hand-raise-input__status-content">
              <div className="hand-raise-input__status-title">
                {t('handRaise.handRaised')}
              </div>
              <div className="hand-raise-input__status-position">
                {t('handRaise.yourPosition', { position: userPosition })}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (!hasRaisedHand && !userName.trim())}
          className={`hand-raise-input__button ${
            hasRaisedHand
              ? 'hand-raise-input__button--lower'
              : 'hand-raise-input__button--raise'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="hand-raise-input__spinner" />
              {t('handRaise.processing')}
            </>
          ) : hasRaisedHand ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              {t('handRaise.lowerHand')}
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12-4c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
              </svg>
              {t('handRaise.raiseHand')}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default HandRaiseInput;