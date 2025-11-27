import React, { useState } from 'react';
import { Client, Invoice } from '../types';
import { validateSurcharge } from '../utils/helpers';

interface SettingsPanelProps {
  client: Client | null;
  surcharge: number;
  vendorSurcharge: number;
  invoices: Invoice[];
  onClose: () => void;
  onShowUpdateModal: (title: string, isReverting: boolean) => void;
  onSaveSurcharge: (items: any[]) => Promise<void>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  client,
  surcharge,
  vendorSurcharge,
  invoices,
  onClose,
  onShowUpdateModal,
  onSaveSurcharge
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSurcharge, setEditedSurcharge] = useState(surcharge * 100);

  const isCustomSurcharge = surcharge !== vendorSurcharge;

  const handleSave = async () => {
    const surchargeValue = editedSurcharge / 100;

    if (!validateSurcharge(surchargeValue, vendorSurcharge)) {
      return;
    }

    if (invoices.length > 0) {
      onShowUpdateModal('Apply Custom Account Surcharge To:', false);
    } else {
      await onSaveSurcharge([{
        ClientLookupCode: client?.LookupCode || '',
        SurchargeAmount: surchargeValue
      }]);
      setIsEditing(false);
      onClose();
    }
  };

  const handleRevert = () => {
    if (invoices.length > 0) {
      onShowUpdateModal('Revert Account Surcharge To System Default', true);
    } else {
      revertToDefault();
    }
  };

  const revertToDefault = async () => {
    await onSaveSurcharge([{
      ClientLookupCode: client?.LookupCode || '',
      SurchargeAmount: vendorSurcharge
    }]);
    setIsEditing(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" style={{ display: 'flex' }}>
      <div className="card" style={{ width: '599px' }}>
        <div className="card-header" style={{ position: 'relative' }}>
          <div>
            <h3 style={{ paddingBottom: '10px' }}>
              <i className="fas fa-building"></i>
              Client Information
              <span className="client-badge">{client?.LookupCode}</span>
            </h3>
            <div style={{ paddingLeft: '20px' }}>
              {client?.ClientName}
            </div>
          </div>
          <i
            className="fa-solid fa-x"
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '15px',
              top: '15px',
              cursor: 'pointer'
            }}
          />
        </div>

        <div className="card-body">
          {!isEditing ? (
            <div className="surcharge-row">
              <label style={{ display: 'flex' }}>
                Account Surcharge
                {isCustomSurcharge && (
                  <span
                    style={{
                      background: 'var(--surcharge-custom)',
                      borderRadius: '30px',
                      padding: '3px 10px',
                      color: 'white',
                      marginLeft: '5px'
                    }}
                  >
                    Custom
                  </span>
                )}
              </label>
              <div className="surcharge-value">
                <span>{surcharge * 100}%</span>
                <div>
                  <span style={{ padding: '2px' }}>
                    <button
                      className="btn btn-icon btn-edit tooltip"
                      data-tooltip="Edit Custom Rate"
                      onClick={() => setIsEditing(true)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                  </span>
                  {isCustomSurcharge && (
                    <span style={{ padding: '2px' }}>
                      <button
                        className="btn btn-icon btn-edit tooltip"
                        data-tooltip="Revert account rate to default"
                        onClick={handleRevert}
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="surcharge-row">
              <label>Edit Account Surcharge</label>
              <div className="input-group">
                <div className="input-wrapper">
                  <input
                    type="number"
                    step="0.01"
                    value={editedSurcharge}
                    onChange={(e) => setEditedSurcharge(parseFloat(e.target.value))}
                    min="0"
                    max="3.5"
                  />
                </div>
                <span className="percent-sign">%</span>
                <div className="btn-group">
                  <button
                    className="btn btn-icon btn-save"
                    data-tooltip="Save"
                    onClick={handleSave}
                  >
                    <i className="fas fa-check"></i>
                  </button>
                  <button
                    className="btn btn-icon btn-cancel"
                    data-tooltip="Cancel"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedSurcharge(surcharge * 100);
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
