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
  isDev : boolean;
  setIsAuthenticated: (auth: boolean) => void
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ subdomain, setIsAuthenticated, isDev }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [surcharge, setSurcharge] = useState<number>(0);
  const [vendorSurcharge, setVendorSurcharge] = useState<number>(0);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [paylinkSubdomain , setPaylinkSubdomain] = useState<string>(subdomain);
  
  const [updateModalConfig, setUpdateModalConfig] = useState<{
    title: string;
    isReverting: boolean;
  }>({ title: '', isReverting: false });

  const apiService = new ApiService(isDev, subdomain, () => { setIsAuthenticated(false); });
  const accountId = getCurrentAccountID();
  const lookupCode = getAccountLookupCode();

  useEffect(() => {
    loadData();
   
  }, []);

 useEffect(() => {
    loadInvoices();
    
  }, [client?.LookupCode]);


  const loadData = async () => {
    try {
      //setLoading(true);

      // Get client data

      const parts = document.title.split(' - ');
      let clientData = {

        LookupCode: parts[0]?.trim() || 'UnknownID',
        ClientName: parts[1]?.trim() || 'UnknownName'
      };
      setClient(clientData);
      if (accountId) {
        try {
          clientData = await apiService.getClientFromEpic(accountId) ?? clientData;
        } 
        catch (error) {
          console.error('Error fetching client:', error);
          const parts = document.title.split(' - ');
          clientData = {
            LookupCode: parts[0]?.trim() || 'UnknownID',
            ClientName: parts[1]?.trim() || 'UnknownName'
          };
        }
      }
      else 
      {
        try {
          clientData = await apiService.getClientFromEpicWithLookup(lookupCode) ?? clientData;
        } catch (error) {
          console.error('Error fetching client by lookup code:', error);
        }
      }
      setClient(clientData);
      // setLookupCode(clientData.LookupCode);

      // Get surcharge
      const surchargeData = await apiService.getSurcharge(clientData.LookupCode);
      setSurcharge(surchargeData.surcharge);
      setVendorSurcharge(surchargeData.vendorSurcharge);

      

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };


  const loadInvoices = async () => {
    if (!client) return;
    
    try {
      // Get invoices
      setInvoicesLoading(true); 
      const invoiceData = await apiService.getOpenInvoices(accountId, client.LookupCode);
      const invoicesWithIds = invoiceData.map((inv, index) => ({ ...inv, id: index }));
      setInvoices(invoicesWithIds);

      // Select all invoices by default
      const allInvoiceNumbers = new Set(invoicesWithIds.map(inv => inv.AppliedEpicInvoiceNumber));
      setSelectedInvoices(allInvoiceNumbers);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setInvoicesLoading(false);
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
              accountId={accountId}
              surcharge={surcharge}
              isDev={isDev}
              subdomain={subdomain}
              paylinkSubdomain={paylinkSubdomain}
              setPaylinkSubdomain={setPaylinkSubdomain}
              onShowCopied={() => {
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 3000);
              }}
            />


           { invoicesLoading ? (
              <div className="loading-div">
                <div className="spinner"></div>
                <p>Loading invoices...</p>
              </div>
            ) : (
            <>{invoices.filter(a=> a.AgencySubdomain == paylinkSubdomain && a.Balance != 0).length > 0 && (
              <InvoiceList
                invoices={invoices}
                subdomain={subdomain}
                selectedInvoices={selectedInvoices}
                surcharge={surcharge}
                vendorSurcharge={vendorSurcharge}
                client={client}
                accountId={accountId}
                onInvoiceUpdate={loadData}
                paylinkSubdomain={paylinkSubdomain}
                isDev={isDev}
                onSelectionChange={setSelectedInvoices}
                onShowCopied={() => {
                  setShowCopied(true);
                  setTimeout(() => setShowCopied(false), 2000);
                }}
                onSaveSurcharge={handleSaveSurcharge}
              />
            )}
            </>
          )
          }
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
