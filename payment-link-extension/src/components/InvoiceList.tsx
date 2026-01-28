import React from 'react';
import { Invoice, Client } from '../types';
import { InvoiceRow } from './InvoiceRow';
import { generatePaymentUrl, copyToClipboard, generateEmailUrl } from '../utils/helpers';
import { EmailForm } from './EmailModal';
import { useState } from 'react';

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
  paylinkSubdomain: string;
  isDev: boolean;
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
  onSaveSurcharge,
  paylinkSubdomain, 
  isDev
}) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [mail, setMail] = useState<string>("");
  const handleCopyMultiple = async () => {
    
    if (!client || selectedInvoices.size === 0) return;

    const url = generatePaymentUrl(paylinkSubdomain, client.LookupCode, accountId, {
      invoiceIds: Array.from(selectedInvoices)
    });

    await copyToClipboard(url);
    onShowCopied();
  };

  const handleCollectPayment = () => {
    

    const totalBalance = invoices.reduce((sum, item) => {
      return selectedInvoices.has(item.AppliedEpicInvoiceNumber) ? sum + item.Balance : sum;
    }, 0);
    chrome.runtime.sendMessage({
      action: "OPEN_PAYMENT_WINDOW",
      invoiceId: Array.from(selectedInvoices).join(','),
      amount: totalBalance,
      customerLookup: client?.LookupCode || "",
      accountId: accountId,
      clientName: client?.ClientName || "",
      subdomain: paylinkSubdomain,
      surcharge: surcharge
    });
  }

  const handleBackendEmail = () => {
    setMail(mailBody());
    setIsEmailModalOpen(true);
  }

  const mailBody = (): string => {
   
    if (!client || selectedInvoices.size === 0) return "";

    const totalBalance = invoices.reduce((sum, item) => {
      return selectedInvoices.has(item.AppliedEpicInvoiceNumber) ? sum + item.Balance : sum;
    }, 0);

    const url = generatePaymentUrl(paylinkSubdomain, client.LookupCode, accountId, {
      invoiceIds: Array.from(selectedInvoices)
    });

    const invoiceText = selectedInvoices.size > 1 ? 's' : '';
    const mailBody = `Hi,

Please find below the payment information for Invoice #${invoiceText}${Array.from(selectedInvoices).join(',')}, with a total balance of $${totalBalance.toFixed(2)}. We kindly request that you submit payment at your earliest convenience.

You may pay securely using the link below:
Payment Link: ${url}

If you have any questions or need assistance, please let us know`;
    return mailBody
  }

  const handleEmailMultiple = () => {
    if (!client || selectedInvoices.size === 0) return;
    const mail = mailBody();

    const mailtoUrl = generateEmailUrl(
      client.EmailAddress || '',
      'Invoice Reminder for ' + client.ClientName,
      client.CSREmailAddress || '',
      mail
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

  

  const ActionButtonStyles = {
    color: '#22845a99',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    display: 'inline-flex',
    alignItems: 'center',
    width: '11.5rem',
    border: '1px solid', 
    padding: '5px',
    justifycontent: 'center',
    borderRadius: 'var(--radius)'
  };

  return (<>
    {isEmailModalOpen && <EmailForm
      text={mail}
      isDev={isDev}
      client={client}
      subdomain={paylinkSubdomain}
      onClose={() => setIsEmailModalOpen(false)}
      onSuccess={() => setIsEmailModalOpen(false)}
    />}
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
              <th>Partial Pymt</th>
              <th> Agency Code</th>
            </tr>
          </thead>
          <tbody>
            {invoices.filter(i => i.AgencySubdomain == paylinkSubdomain && i.Balance != 0).map((invoice) => (
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

      <div style={{ marginLeft: '5px', marginTop: '20px', textDecoration: 'underline', display: 'flex' }}>
        Selected Invoice Actions
      </div>

      <div style={{ margin: '5px', display: 'flex', gap: '6px' }}>
        

        <button style={ActionButtonStyles} onClick={handleCollectPayment}>
          <i className="fa-solid fa-file-invoice-dollar"></i> Take Payment
        </button>

         <button  style={ActionButtonStyles} onClick={handleBackendEmail}>
          <i className="fa-regular fa-envelope"></i> Email Payment Link
        </button>

        <button style={ActionButtonStyles} onClick={handleCopyMultiple}>
          <i className="fas fa-link"></i> Copy payment link
        </button>
         
      </div>

      
     
    </div></>
  );
};
