import React, { useState } from 'react';
import { Client } from '../types';
import { generatePaymentUrl, copyToClipboard } from '../utils/helpers';
import { useEffect } from 'react';
import { ApiService, getAccountLookupCode } from '../utils/api';



interface ClientInfoProps {
  client: Client | null;
  subdomain: string;
  accountId: string | null;
  surcharge?: number;
  onShowCopied: () => void;
  isDev?: boolean;
}

export const ClientInfo: React.FC<ClientInfoProps> = ({
  client,
  subdomain,
  accountId,
  surcharge,
  onShowCopied,
  isDev
}) => {

  const apiService = new ApiService(isDev || false, subdomain);

  const [paylinkSubdomain, setPaylinkSubdomain] = useState(subdomain);
  const [accountList, setAccountList] = useState<{ CardknoxAccountCode: string, Subdomain: string, AgencyCode: string }[]>([])
  const [amount, setAmount] = useState<string>('');


  useEffect(() => {

    async function getClients() {
      const accounts = await apiService.getCardknoxAccounts(client?.LookupCode ?? "")
      setAccountList(accounts)
    }
    getClients();

  }, [client]


  )

  const handleGenerateLink = async () => {
    if (!amount || !client) return;

    const url = generatePaymentUrl(paylinkSubdomain, client.LookupCode, accountId, {
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
      clientName: client?.ClientName || "",
      subdomain: paylinkSubdomain,
      surcharge: surcharge
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

         { accountList.length > 1  && <div style={{ display: 'flex', alignItems: 'center' }}>
          Payment Account:
          <select
            value={paylinkSubdomain}
            onChange={(e) => setPaylinkSubdomain(e.target.value)}
            style={{
              marginLeft: '10px',
              marginBottom: '6px',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {accountList.map((account, index) => (
              <option key={index} value={account.Subdomain}>
                <span style={{ fontWeight: "bold" }}>{account.CardknoxAccountCode}</span> - {account.AgencyCode}
              </option>
            ))}
          </select>
        </div>
        }
        <div>
          Amount:
          <input
            placeholder="$"
            type="number"
            step="10"
            value={amount}
            style={{ textAlign: 'left', marginLeft: '10px', width: '150px' }}
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
