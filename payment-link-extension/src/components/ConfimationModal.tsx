import React, { ReactNode } from 'react';

interface ConfirmationModalProps {
  onClose: () => void;
  onConfirm: () => void;
  children?: ReactNode;
  confirmButtonText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  onClose,
  onConfirm,
  children,
  confirmButtonText = 'Confirm',
}) => {
  return (
    <div className="modal-overlay dark">
      <div className="modal confirm">
        <button
          onClick={onClose}
          type="button"
          className="modal-close"
        >
          &times;
        </button>

        {children}

        <div className="modal-footer">
          <button
            className="btn-2 btn-primary"
            type="button"
            onClick={onConfirm}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
