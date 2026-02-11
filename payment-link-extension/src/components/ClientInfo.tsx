import React, { useState } from 'react';
import { Client } from '../types';
import { generatePaymentUrl, copyToClipboard } from '../utils/helpers';
import { useEffect } from 'react';
import { ApiService, getAccountLookupCode } from '../utils/api';
import { EmailForm } from './EmailModal';



interface ClientInfoProps {
  client: Client | null;
  subdomain: string;
  accountId: string | null;
  surcharge?: number;
  onShowCopied: () => void;
  paylinkSubdomain: string;
  setPaylinkSubdomain: (subdomain: string) => void;
  isDev?: boolean;
}

export const ClientInfo: React.FC<ClientInfoProps> = ({
  client,
  subdomain,
  accountId,
  surcharge,
  onShowCopied,
  paylinkSubdomain = subdomain,
  setPaylinkSubdomain,
  isDev
}) => {

  const apiService = new ApiService(isDev || false, subdomain);

  const [accountList, setAccountList] = useState<{ CardknoxAccountCode: string, Subdomain: string, AgencyCode: string }[]>([])
  const [amount, setAmount] = useState<string>('');
  const [mail, setMail] = useState<string>('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [submitted , setSubmitted ] = useState<boolean>(false);

      const toastStyle: React.CSSProperties = {
          position: "relative",
          top: "-48px",
          left: "60px",
          width: "fit-content",
          backgroundColor: "#dc3545",
          color: "white",
          textAlign: "center",
          fontSize: "0.7em",
          opacity: 1,
          transform: "translateY(0px)",
          pointerEvents: "none",
          zIndex: 1000,
          padding: "0px 7px",
          borderRadius: "4px",
          transition: "opacity 0.3s, transform 0.3s",
          whiteSpace: "nowrap"
      }
  


  useEffect(() => {

    async function getAccounts() {
      const accounts = await apiService.getCardknoxAccounts(client?.LookupCode ?? "")
      setAccountList(accounts)
    }
     if(client?.LookupCode ?? "" != "") getAccounts();

  }, [client]


  )

  const handleGenerateLink = async () => {
    setSubmitted(true);
    if (!amount || !client) return;

    const url = generatePaymentUrl(paylinkSubdomain, client.LookupCode, accountId, {
      amount: parseFloat(amount)
    });

    await copyToClipboard(url);
    onShowCopied();
  };




  const mailBody = () => {
    
    if (!amount || !client) return "";
    
    const url = generatePaymentUrl(paylinkSubdomain, client.LookupCode, accountId, {
      amount: parseFloat(amount)
    });

    const mailBody = `Hi,

Please find below the payment information for your balance of $${parseFloat(amount).toFixed(2)}. We kindly request that you submit payment at your earliest convenience.

You may pay securely using the link below:
Payment Link: ${url}

If you have any questions or need assistance, please let us know`;
    return mailBody
  }

  const handleBackendEmail = () => {
    setSubmitted(true);
    if(!amount || !client) return;
    setMail(mailBody());
    setIsEmailModalOpen(true);
  }

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

  return (
   <>
     {isEmailModalOpen && <EmailForm
      text={mail}
      isDev={isDev??false}
      client={client}
      subdomain={paylinkSubdomain}
      onClose={() => setIsEmailModalOpen(false)}
      onSuccess={() => setIsEmailModalOpen(false)}
    />}
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

        {accountList.length > 1 && <div style={{ display: 'flex', alignItems: 'center' }}>
          Payment Account:
          <select
            value={paylinkSubdomain}
            onChange={(e) => setPaylinkSubdomain(e.target.value ?? '')}
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
            style={{...{ textAlign: 'left', marginLeft: '10px', width: '150px' }, ...(submitted && !amount ? { border: '1px solid red' } : {})}}
            onChange={(e) => setAmount(e.target.value)}
          />
           {submitted && !amount && <div style={toastStyle}>Amount required.</div>}
        </div>

        <div style={{ marginLeft: '5px', marginTop: '20px', textDecoration: 'underline', display: 'flex' }}>
          
        </div>

        <div style={{ margin: '5px', display: 'flex', gap: '6px' }}>


          <button style={ActionButtonStyles} onClick={handleCollectPayment}>
            <i className="fa-solid fa-file-invoice-dollar"></i> Take Payment
          </button>

          <button style={ActionButtonStyles} onClick={handleBackendEmail}>
            <i className="fa-regular fa-envelope"></i> Email Payment Link
          </button>



          <button style={ActionButtonStyles} onClick={handleGenerateLink}>
            <i className="fas fa-link"></i> Copy payment link
          </button>

        </div>



      </div>
    </div>
    </>
  );
};
