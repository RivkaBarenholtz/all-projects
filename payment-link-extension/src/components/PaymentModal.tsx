import React, { useState, useEffect } from 'react';
import { Client, Invoice } from '../types';
import { ApiService, getCurrentAccountID, getAccountLookupCode } from '../utils/api';
import { ClientInfo } from './ClientInfo';
import { InvoiceList } from './InvoiceList';
import { SettingsPanel } from './SettingsPanel';
import { UpdateOptionsModal } from './UpdateOptionsModal';
import { CollectPaymentModal } from './CollectPaymentModal';

interface PaymentModalProps {
  subdomain: string;
  setIsAuthenticated :(auth:boolean)=>void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({  subdomain, setIsAuthenticated }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [surcharge, setSurcharge] = useState<number>(0);
  const [vendorSurcharge, setVendorSurcharge] = useState<number>(0);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateModalConfig, setUpdateModalConfig] = useState<{
    title: string;
    isReverting: boolean;
  }>({ title: '', isReverting: false });

  const apiService = new ApiService(subdomain, ()=> { setIsAuthenticated(false); });
  const accountId = getCurrentAccountID();
  const lookupCode = getAccountLookupCode();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get client data
      
      const parts = document.title.split(' - ');
      let clientData = {
          
          LookupCode: parts[0]?.trim() || 'UnknownID',
          ClientName: parts[1]?.trim() || 'UnknownName'
        };
      if (accountId) {
        try {
          clientData = await apiService.getClientFromEpic(accountId)??clientData;
        } catch (error) {
          console.error('Error fetching client:', error);
          const parts = document.title.split(' - ');
          clientData = {
            LookupCode: parts[0]?.trim() || 'UnknownID',
            ClientName: parts[1]?.trim() || 'UnknownName'
          };
        }
      } 
      
      setClient(clientData);
     // setLookupCode(clientData.LookupCode);

      // Get surcharge
      const surchargeData = await apiService.getSurcharge(clientData.LookupCode);
      setSurcharge(surchargeData.surcharge);
      setVendorSurcharge(surchargeData.vendorSurcharge);

      // Get invoices
      
        const invoiceData = await apiService.getOpenInvoices(accountId, clientData.LookupCode);
        const invoicesWithIds = invoiceData.map((inv, index) => ({ ...inv, id: index }));
        setInvoices(invoicesWithIds);
        
        // Select all invoices by default
        const allInvoiceNumbers = new Set(invoicesWithIds.map(inv => inv.AppliedEpicInvoiceNumber));
        setSelectedInvoices(allInvoiceNumbers);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSurcharge = async (items: any[]) => {
    try {
      await apiService.saveSurcharge(items);
      await loadData();
    } catch (error) {
      console.error('Error saving surcharge:', error);
      alert('Failed to save surcharge');
    }
  };

  const handleShowUpdateModal = (title: string, isReverting: boolean) => {
    setUpdateModalConfig({ title, isReverting });
    setShowUpdateModal(true);
  };

  return (
    <>

        {showCopied && (
          <div id="copiedBlurb">Copied...</div>
        )}

        <div className="container">
          {loading ? (
            <div className="loading-div">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <>
              <ClientInfo
                client={client}
                subdomain={subdomain}
                accountId={accountId}
                surcharge={surcharge}
                onShowCopied={() => {
                  setShowCopied(true);
                  setTimeout(() => setShowCopied(false), 3000);
                }}
              />
            

              {invoices.length > 0 && (
                <InvoiceList
                  invoices={invoices}
                  selectedInvoices={selectedInvoices}
                  surcharge={surcharge}
                  vendorSurcharge={vendorSurcharge}
                  client={client}
                  subdomain={subdomain}
                  accountId={accountId}
                  onInvoiceUpdate={loadData}
                  onSelectionChange={setSelectedInvoices}
                  onShowCopied={() => {
                    setShowCopied(true);
                    setTimeout(() => setShowCopied(false), 2000);
                  }}
                  onSaveSurcharge={handleSaveSurcharge}
                />
              )}

              <i 
                className="fa-solid fa-gear gear-icon" 
                title="View account settings"
                onClick={() => setShowSettings(true)}
              />
            </>
          )}
        </div>

        {showSettings && (
          <SettingsPanel
            client={client}
            surcharge={surcharge}
            vendorSurcharge={vendorSurcharge}
            invoices={invoices}
            onClose={() => {
              setShowSettings(false);
              loadData();
            }}
            onShowUpdateModal={handleShowUpdateModal}
            onSaveSurcharge={handleSaveSurcharge}
          />
        )}

        {showUpdateModal && (
          <UpdateOptionsModal
            title={updateModalConfig.title}
            isReverting={updateModalConfig.isReverting}
            invoices={invoices}
            client={client}
            surcharge={surcharge}
            vendorSurcharge={vendorSurcharge}
            onClose={() => setShowUpdateModal(false)}
            onSave={async (items) => {
              await handleSaveSurcharge(items);
              setShowUpdateModal(false);
              setShowSettings(false);
            }}
          />
        )}

      </>
     
  );
};
