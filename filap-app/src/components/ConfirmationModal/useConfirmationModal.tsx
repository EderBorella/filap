import React, { useState, useCallback } from 'react';
import ConfirmationModal, { ConfirmationModalProps } from './ConfirmationModal';

interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
}

interface UseConfirmationModalReturn {
  showConfirmation: (options: ConfirmationOptions) => Promise<boolean>;
  ConfirmationModalComponent: React.FC;
}

export const useConfirmationModal = (): UseConfirmationModalReturn => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmationOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showConfirmation = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback((): void => {
    if (modalState?.resolve) {
      modalState.resolve(true);
      setModalState(null);
    }
  }, [modalState]);

  const handleCancel = useCallback((): void => {
    if (modalState?.resolve) {
      modalState.resolve(false);
      setModalState(null);
    }
  }, [modalState]);

  const handleClose = useCallback((): void => {
    if (modalState?.resolve) {
      modalState.resolve(false);
      setModalState(null);
    }
  }, [modalState]);

  const ConfirmationModalComponent: React.FC = useCallback(() => {
    if (!modalState) return null;

    return (
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={modalState.options.title}
        message={modalState.options.message}
        confirmText={modalState.options.confirmText}
        cancelText={modalState.options.cancelText}
        confirmVariant={modalState.options.confirmVariant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onClose={handleClose}
      />
    );
  }, [modalState, handleConfirm, handleCancel, handleClose]);

  return {
    showConfirmation,
    ConfirmationModalComponent
  };
};