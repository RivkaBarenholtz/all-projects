import React, { useState } from 'react';
import { Invoice, Client } from '../types';
import { validateSurcharge } from '../utils/helpers';

interface InvoiceRowProps {
  invoice: Invoice;
  isSelected: boolean;
  defaultSurcharge: number;
  vendorSurcharge: number;
  client: Client | null;
  onToggleSelection: (invoiceNumber: string, isSelected: boolean) => void;
  onSaveSurcharge: (items: any[]) => Promise<void>;
  onUpdate: () => void;
}

export const InvoiceRow: React.FC<InvoiceRowProps> = ({
  invoice,
  isSelected,
  defaultSurcharge,
  vendorSurcharge,
  client,
  onToggleSelection,
  onSaveSurcharge,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSurcharge, setEditedSurcharge] = useState(invoice.Surcharge * 100);
  const [isEditableChecked, setIsEditableChecked] = useState(invoice.IsEditable);

  const isCustomSurcharge = invoice.Surcharge !== defaultSurcharge;
  const colorStyle = isCustomSurcharge ? 'var(--surcharge-color-custom)' : 'var(--surcharge-color-default)';

  const handleSave = async () => {
    const surchargeValue = editedSurcharge / 100;
    
    if (!validateSurcharge(surchargeValue, vendorSurcharge)) {
      return;
    }

    await onSaveSurcharge([{
      ClientLookupCode: client?.LookupCode || '',
      SurchargeAmount: surchargeValue,
      InvoiceNumber: invoice.AppliedEpicInvoiceNumber,
      IsEditable: invoice.IsEditable
    }]);

    setIsEditing(false);
    onUpdate();
  };

  const handleEditableChange = async (checked: boolean) => {
    setIsEditableChecked(checked);
    
    await onSaveSurcharge([{
      ClientLookupCode: client?.LookupCode || '',
      SurchargeAmount: invoice.Surcharge,
      InvoiceNumber: invoice.AppliedEpicInvoiceNumber,
      IsEditable: checked
    }]);
    
    onUpdate();
  };

  return (
    <tr className={`${isSelected ? 'selected-row' : ''} ${isEditing ? 'editing-row' : ''}`}>
      <td className="invoice-number">
        <input
          className="select-row-checkbox"
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelection(invoice.AppliedEpicInvoiceNumber, e.target.checked)}
        />
        {invoice.AppliedEpicInvoiceNumber}
      </td>
      <td className="money-value">${invoice.InvoiceTotal.toFixed(2)}</td>
      <td className="money-value">${invoice.Balance.toFixed(2)}</td>
      <td className="surcharge-cell">
        {isEditing ? (
          <div className="input-group">
            <div className="input-wrapper">
              <input
                type="number"
                step="0.01"
                className="surcharge-input"
                value={editedSurcharge}
                onChange={(e) => setEditedSurcharge(parseFloat(e.target.value))}
                min="0"
                max="3.5"
              />
            </div>
            <span className="percent-sign">%</span>
            <div className="btn-group">
              <button
                className="btn btn-icon btn-save tooltip"
                data-tooltip="Save Surcharge"
                onClick={handleSave}
              >
                <i className="fas fa-check"></i>
              </button>
              <button
                className="btn btn-icon btn-cancel tooltip"
                data-tooltip="Cancel Edit"
                onClick={() => {
                  setIsEditing(false);
                  setEditedSurcharge(invoice.Surcharge * 100);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="surcharge-value" style={{ color: colorStyle }}>
              {invoice.Surcharge * 100}%
            </span>
            <div className="btn-group">
              <button
                className="btn btn-icon btn-edit tooltip"
                data-tooltip="Edit Surcharge"
                onClick={() => setIsEditing(true)}
              >
                <i className="fas fa-edit"></i>
              </button>
            </div>
          </>
        )}
      </td>
      <td>
        <input
          className="btn btn-is-editable"
          type="checkbox"
          checked={isEditableChecked}
          onChange={(e) => handleEditableChange(e.target.checked)}
        />
      </td>
    </tr>
  );
};
