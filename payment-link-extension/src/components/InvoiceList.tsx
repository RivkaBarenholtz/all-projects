import React from 'react';
import { Invoice, Client } from '../types';
import { InvoiceRow } from './InvoiceRow';
import { generatePaymentUrl, copyToClipboard, generateEmailUrl } from '../utils/helpers';

interface InvoiceListProps {
  invoices: Invoice[];
  selectedInvoices: Set<string>;
  surcharge: number;
  vendorSurcharge: number;
  client: Client | null;
  subdomain: string;
  accountId: string | null;
  onInvoiceUpdate: () => void;
  onSelectionChange: (selected: Set<string>) => void;
  onShowCopied: () => void;
  onSaveSurcharge: (items: any[]) => Promise<void>;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  selectedInvoices,
  surcharge,
  vendorSurcharge,
  client,
  subdomain,
  accountId,
  onInvoiceUpdate,
  onSelectionChange,
  onShowCopied,
  onSaveSurcharge
}) => {
  const handleCopyMultiple = async () => {
    if (!client || selectedInvoices.size === 0) return;

    const url = generatePaymentUrl(subdomain, client.LookupCode, accountId, {
      invoiceIds: Array.from(selectedInvoices)
    });

    await copyToClipboard(url);
    onShowCopied();
  };

  const handleEmailMultiple = () => {
    if (!client || selectedInvoices.size === 0) return;

    const totalBalance = invoices.reduce((sum, item) => {
      return selectedInvoices.has(item.AppliedEpicInvoiceNumber) ? sum + item.Balance : sum;
    }, 0);

    const url = generatePaymentUrl(subdomain, client.LookupCode, accountId, {
      invoiceIds: Array.from(selectedInvoices)
    });

    const invoiceText = selectedInvoices.size > 1 ? 's' : '';
    const mailBody = `Hi, you have open invoice #${invoiceText} ${Array.from(selectedInvoices).join(',')} for a total balance of $${totalBalance.toFixed(2)}. Your prompt payment would be very much appreciated. To pay please click here: ${url}`;

    const mailtoUrl = generateEmailUrl(
      client.EmailAddress || '',
      'Invoice Reminder',
      mailBody
    );

    window.open(mailtoUrl, '_blank');
  };

  const handleToggleSelection = (invoiceNumber: string, isSelected: boolean) => {
    const newSelection = new Set(selectedInvoices);
    if (isSelected) {
      newSelection.add(invoiceNumber);
    } else {
      newSelection.delete(invoiceNumber);
    }
    onSelectionChange(newSelection);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <i className="fas fa-file-invoice-dollar"></i>
          Invoice List
        </h3>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Invoice Amount</th>
              <th>Balance</th>
              <th>Surcharge</th>
              <th>Allow Partial Payment</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                isSelected={selectedInvoices.has(invoice.AppliedEpicInvoiceNumber)}
                defaultSurcharge={surcharge}
                vendorSurcharge={vendorSurcharge}
                client={client}
                onToggleSelection={handleToggleSelection}
                onSaveSurcharge={onSaveSurcharge}
                onUpdate={onInvoiceUpdate}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ margin: '12px', display: 'flex' }}>
        <button className="btn btn-icon link-btn" onClick={handleCopyMultiple}>
          <i className="fas fa-link"></i>
        </button>
        Copy payment link for selected invoices
      </div>

      <div style={{ margin: '12px', display: 'flex' }}>
        <button className="btn btn-icon link-btn" onClick={handleEmailMultiple}>
          <i className="fa-regular fa-envelope"></i>
        </button>
        Email payment link for selected invoices
      </div>
    </div>
  );
};
