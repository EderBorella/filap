import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { QueueService, StorageService } from '../../services';
import { useToast } from '../Toast';
import './Hero.scss';

const Hero: React.FC = () => {
  const { t } = useTranslation();
  const [queueCode, setQueueCode] = useState('');
  const [isValidCode, setIsValidCode] = useState(false);
  const [isCreatingQueue, setIsCreatingQueue] = useState(false);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.trim();
    setQueueCode(value);
    setIsValidCode(QueueService.isValidUUID(value));
  };

  const handleCreateQueue = async (): Promise<void> => {
    setIsCreatingQueue(true);
    
    try {
      // Create queue via API
      const queueResponse = await QueueService.createQueue({
        name: 'My Queue',
        default_sort_order: 'votes'
      });

      // Store host data in localStorage
      StorageService.storeQueueData(queueResponse.id, {
        hostSecret: queueResponse.host_secret,
        queueName: queueResponse.name,
        expiresAt: queueResponse.expires_at
      });

      // Show success message and navigate
      showSuccess(t('toast.queueCreated'));
      navigate(`/queues/${queueResponse.id}`);
      
    } catch (error) {
      console.error('Error creating queue:', error);
      showError(t('toast.errors.createQueueFailed'));
    } finally {
      setIsCreatingQueue(false);
    }
  };

  const handleJoinQueue = async (): Promise<void> => {
    if (!isValidCode) return;
    
    setIsJoiningQueue(true);
    
    try {
      // Generate user token for this queue
      const userTokenResponse = await QueueService.generateUserToken(queueCode);
      
      // Store user token in localStorage
      StorageService.storeQueueData(queueCode, {
        userToken: userTokenResponse.user_token,
        expiresAt: userTokenResponse.expires_at
      });

      // Show success message and navigate
      showSuccess(t('toast.joinedQueue'));
      navigate(`/queues/${queueCode}`);
      
    } catch (error) {
      console.error('Error joining queue:', error);
      showError(t('toast.errors.joinQueueFailed'));
    } finally {
      setIsJoiningQueue(false);
    }
  };

  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__content">
          <h1 className="hero__title">{t('hero.title')}</h1>
          <p className="hero__subtitle">
            {t('hero.subtitle')}
          </p>
        </div>

        <div className="hero__actions">
          <div className="hero__primary-action">
            <button 
              className={`btn btn--primary btn--large ${isCreatingQueue ? 'btn--loading' : ''}`}
              onClick={handleCreateQueue}
              disabled={isCreatingQueue}
            >
              {isCreatingQueue ? t('hero.creating') : t('hero.createQueue')}
            </button>
          </div>

          <div className="hero__secondary-action">
            <div className="hero__join-card">
              <h3 className="hero__join-title">{t('hero.joinTitle')}</h3>
              <div className="hero__join-form">
                <input
                  type="text"
                  className="input input--large"
                  placeholder={t('hero.joinPlaceholder')}
                  value={queueCode}
                  onChange={handleCodeChange}
                  disabled={isJoiningQueue}
                />
                <button
                  className={`btn btn--secondary btn--large ${isJoiningQueue ? 'btn--loading' : ''}`}
                  onClick={handleJoinQueue}
                  disabled={!isValidCode || isJoiningQueue}
                >
                  {isJoiningQueue ? t('hero.joining') : t('hero.joinButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;