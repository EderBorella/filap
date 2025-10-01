import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './SpeakingTimer.scss';

export interface SpeakingTimerProps {
  className?: string;
}

const SpeakingTimer: React.FC<SpeakingTimerProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // Default 2 minutes in seconds
  const [initialTime, setInitialTime] = useState(120);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer tick effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer controls
  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(initialTime);
  };

  // Time setting
  const handleTimeChange = (minutes: number) => {
    const newTime = minutes * 60;
    setInitialTime(newTime);
    setTimeLeft(newTime);
    setIsRunning(false);
    setShowSettings(false);
  };

  // Handle modal backdrop click
  const handleModalBackdrop = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      setShowSettings(false);
    }
  };

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && showSettings) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showSettings]);

  // Quick time presets
  const timePresets = [1, 2, 3, 5, 10];

  // Calculate progress percentage
  const progressPercentage = initialTime > 0 ? ((initialTime - timeLeft) / initialTime) * 100 : 0;

  // Determine timer status
  const isExpired = timeLeft === 0;
  const isWarning = timeLeft <= 30 && timeLeft > 0; // Last 30 seconds

  return (
    <div className={`speaking-timer ${className}`}>
      {/* Timer Display with Side Controls */}
      <div className="speaking-timer__main">
        {/* Left Control - Start/Pause */}
        <div className="speaking-timer__left-control">
          {!isRunning ? (
            <button
              className="speaking-timer__btn speaking-timer__btn--start"
              onClick={handleStart}
              disabled={timeLeft === 0}
              title={t('timer.start')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          ) : (
            <button
              className="speaking-timer__btn speaking-timer__btn--pause"
              onClick={handlePause}
              title={t('timer.pause')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
          )}
        </div>

        {/* Center Display */}
        <div className={`speaking-timer__display ${isExpired ? 'speaking-timer__display--expired' : ''} ${isWarning ? 'speaking-timer__display--warning' : ''}`}>
          <div className="speaking-timer__time">
            {formatTime(timeLeft)}
          </div>
          <div className="speaking-timer__progress">
            <div
              className="speaking-timer__progress-bar"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Right Controls - Reset/Settings */}
        <div className="speaking-timer__right-controls">
          <button
            className="speaking-timer__btn speaking-timer__btn--reset"
            onClick={handleReset}
            title={t('timer.reset')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>

          <button
            className="speaking-timer__btn speaking-timer__btn--settings"
            onClick={() => setShowSettings(!showSettings)}
            title={t('timer.settings')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="speaking-timer__modal-backdrop"
          onClick={handleModalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="timer-modal-title"
        >
          <div className="speaking-timer__modal">
            <div className="speaking-timer__modal-header">
              <h3
                id="timer-modal-title"
                className="speaking-timer__modal-title"
              >
                {t('timer.setTime')}
              </h3>

              <button
                className="speaking-timer__modal-close"
                onClick={() => setShowSettings(false)}
                aria-label="Close modal"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="speaking-timer__modal-body">
              <div className="speaking-timer__presets">
                {timePresets.map((minutes) => (
                  <button
                    key={minutes}
                    className={`speaking-timer__preset ${initialTime === minutes * 60 ? 'speaking-timer__preset--active' : ''}`}
                    onClick={() => handleTimeChange(minutes)}
                  >
                    {minutes}{t('timer.minutes')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeakingTimer;