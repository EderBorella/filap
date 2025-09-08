import React, { useState, useRef, useEffect } from 'react';
import { MessageService } from '../../services';
import { StorageService } from '../../services';
import { useToast } from '../Toast';
import './MessageInput.scss';

export interface MessageInputProps {
  queueId: string;
  onMessageSent?: () => void; // Optional callback after message is sent
  isSubmitting?: boolean;
  placeholder?: string;
  maxCharacters?: number;
}

const MessageInput: React.FC<MessageInputProps> = ({
  queueId,
  onMessageSent,
  isSubmitting = false,
  placeholder = "Ask your question...",
  maxCharacters = 300
}) => {
  const [message, setMessage] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [showAuthorField, setShowAuthorField] = useState(true);
  const [isApiSubmitting, setIsApiSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showSuccess, showError } = useToast();

  const remainingChars = maxCharacters - message.length;
  const isMessageEmpty = message.trim().length === 0;
  const isOverLimit = message.length > maxCharacters;

  // Auto-resize textarea
  const adjustTextareaHeight = (): void => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // 120px max height as per design specs
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setMessage(e.target.value);
  };

  const handleAuthorNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setAuthorName(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (isMessageEmpty || isOverLimit || isSubmitting || isApiSubmitting) {
      return;
    }

    const trimmedMessage = message.trim();
    const trimmedAuthorName = authorName.trim();
    
    setIsApiSubmitting(true);
    
    try {
      const userToken = StorageService.getUserToken(queueId);
      if (!userToken) {
        showError('User token not found. Please refresh the page.');
        setIsApiSubmitting(false);
        return;
      }

      await MessageService.createMessage(queueId, {
        text: trimmedMessage,
        author_name: trimmedAuthorName || undefined,
        user_token: userToken
      });

      // Reset form on success
      setMessage('');
      setAuthorName('');
      setShowAuthorField(false);
      
      // Show success message
      showSuccess('Message sent successfully!');
      
      // Call optional callback
      if (onMessageSent) {
        onMessageSent();
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message. Please try again.');
    } finally {
      setIsApiSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // Submit on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleAuthorField = (): void => {
    setShowAuthorField(!showAuthorField);
    if (!showAuthorField) {
      // Focus the author name field when it's shown
      setTimeout(() => {
        const authorInput = document.querySelector('.message-input__author-name') as HTMLInputElement;
        authorInput?.focus();
      }, 100);
    }
  };

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit} className="message-input__form">
        {/* Author Name Field (Collapsible) */}
        {showAuthorField && (
          <div className="message-input__author-section">
            <input
              type="text"
              className="message-input__author-name"
              placeholder="Your name (optional)"
              value={authorName}
              onChange={handleAuthorNameChange}
              maxLength={100}
              disabled={isSubmitting || isApiSubmitting}
            />
          </div>
        )}

        {/* Main Input Area */}
        <div className="message-input__main">
          <div className="message-input__textarea-container">
            <textarea
              ref={textareaRef}
              className={`message-input__textarea ${isOverLimit ? 'message-input__textarea--error' : ''}`}
              placeholder={placeholder}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting || isApiSubmitting}
              rows={1}
            />
            
            {/* Character Counter */}
            <div className={`message-input__char-counter ${remainingChars < 50 ? 'message-input__char-counter--warning' : ''} ${isOverLimit ? 'message-input__char-counter--error' : ''}`}>
              {remainingChars} characters remaining
            </div>
          </div>

          <div className="message-input__actions">
            {/* Toggle Author Name Button */}
            <button
              type="button"
              className={`message-input__toggle-author ${showAuthorField ? 'message-input__toggle-author--active' : ''}`}
              onClick={toggleAuthorField}
              disabled={isSubmitting || isApiSubmitting}
              title={showAuthorField ? 'Hide name field' : 'Add your name (optional)'}
              aria-label={showAuthorField ? 'Hide name field' : 'Show name field'}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              className={`btn btn--primary ${isApiSubmitting ? 'btn--loading' : ''}`}
              disabled={isMessageEmpty || isOverLimit || isSubmitting || isApiSubmitting}
            >
              {isApiSubmitting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </form>
      
      {/* Help Text */}
      <div className="message-input__help">
        Press Ctrl+Enter to send quickly
      </div>
    </div>
  );
};

export default MessageInput;