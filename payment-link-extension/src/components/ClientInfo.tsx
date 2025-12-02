import React, { useState } from 'react';
import { Client } from '../types';
import { generatePaymentUrl, copyToClipboard } from '../utils/helpers';




interface ClientInfoProps {
  client: Client | null;
  subdomain: string;
  accountId: string | null;
  onShowCopied: () => void;
}

export const ClientInfo: React.FC<ClientInfoProps> = ({
  client,
  subdomain,
  accountId,
  onShowCopied
}) => {
  const [amount, setAmount] = useState<string>('');

  const handleGenerateLink = async () => {
    if (!amount || !client) return;

    const url = generatePaymentUrl(subdomain, client.LookupCode, accountId, {
      amount: parseFloat(amount)
    });

    await copyToClipboard(url);
    onShowCopied();
  };

  const handleCollectPayment = () => {
     chrome.runtime.sendMessage({
      action: "OPEN_PAYMENT_WINDOW",
      invoiceId: "-1",
      amount: amount,
      customerLookup: client?.LookupCode || "",
      accountId: accountId,
      clientName : client?.ClientName || "",
      subdomain: subdomain
    });
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>
          <i className="fas fa-building"></i>
          Custom Pay Link
          <span className="client-badge">{client?.LookupCode}</span>
        </h3>
        {client?.ClientName}
      </div>
      <div className="card-body">
        <div>
          Amount:
          <input
            placeholder="$"
            type="number"
            step="10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <button
            className="btn btn-icon link-btn tooltip"
            onClick={handleGenerateLink}
            data-tooltip="Generate payment link"
          >
            <i className="fas fa-link"></i>
          </button>
          Copy payment link for custom amount.
        </div>
        <div>
          <button
            className="btn btn-icon link-btn tooltip"
            onClick={handleCollectPayment}
            data-tooltip="Collect payment"
          >
            <i className="fa-solid fa-file-invoice-dollar"></i>
          </button>
          Take Payment
        </div>
      </div>
    </div>
  );
};
