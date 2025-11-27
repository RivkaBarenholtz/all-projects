import React from 'react';
import { Client, Invoice } from '../types';

interface UpdateOptionsModalProps {
  title: string;
  isReverting: boolean;
  invoices: Invoice[];
  client: Client | null;
  surcharge: number;
  vendorSurcharge: number;
  onClose: () => void;
  onSave: (items: any[]) => Promise<void>;
}

export const UpdateOptionsModal: React.FC<UpdateOptionsModalProps> = ({
  title,
  isReverting,
  invoices,
  client,
  surcharge,
  vendorSurcharge,
  onClose,
  onSave
}) => {
  const handleFutureOnly = async () => {
    const targetSurcharge = isReverting ? vendorSurcharge : surcharge;
    
    await onSave([{
      ClientLookupCode: client?.LookupCode || '',
      SurchargeAmount: targetSurcharge
    }]);
  };

  const handleAllOpen = async () => {
    const targetSurcharge = isReverting ? vendorSurcharge : surcharge;
    const items: any[] = [{
      ClientLookupCode: client?.LookupCode || '',
      SurchargeAmount: targetSurcharge
    }];

    invoices.forEach((invoice) => {
      items.push({
        ClientLookupCode: client?.LookupCode || '',
        SurchargeAmount: targetSurcharge,
        InvoiceNumber: invoice.AppliedEpicInvoiceNumber,
        IsEditable: invoice.IsEditable
      });
    });

    await onSave(items);
  };

  return (
    <div className="modal-backdrop" style={{ display: 'flex' }}>
      <div className="modal-panel">
        <div className="modal-header">
          <i className="fas fa-question-circle"></i>
          <h4>{title}</h4>
        </div>
        <div className="modal-body">
          <div className="modal-options">
            <button onClick={handleFutureOnly} className="modal-btn">
              <i className="fas fa-arrow-right"></i>
              <div>
                <strong>Future Invoices Only</strong>
                <div style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 'normal',
                  marginTop: '0.25rem'
                }}>
                  Existing unedited invoices keep their current surcharge
                </div>
              </div>
            </button>
            <button onClick={handleAllOpen} className="modal-btn">
              <i className="fas fa-sync-alt"></i>
              <div>
                <strong>All Open Invoices</strong>
                <div style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 'normal',
                  marginTop: '0.25rem'
                }}>
                  Overrides all existing invoices
                </div>
              </div>
            </button>
            <button onClick={onClose} className="modal-btn cancel">
              <i className="fas fa-ban"></i>
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
