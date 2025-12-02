import { Client, Invoice, SurchargeItem } from '../types';
import { ApiService as Service } from '../services/apiService';

export class ApiService {
  private subdomain: string;
  private onUnauthorized?: () => void;

  constructor(subdomain: string, onUnauthorized?: () => void) {
    this.subdomain = subdomain;
    this.onUnauthorized = onUnauthorized;
  }

  protected svc = new Service( this.onUnauthorized );

  async getClientFromEpic(clientId: string): Promise<Client> {
    const url = `https://${this.subdomain}.instechpay.co/portal-v1/get-client-from-epic?ClientID=${clientId}`;
    return  await this.svc.get(url);
    
   
  }
  async getClientFromEpicWithLookup(lookupCode: string): Promise<Client> {
    const url = `https://${this.subdomain}.instechpay.co/portal-v1/get-client-from-epic?LookupCode=${lookupCode}`;
    return await this.svc.get(url);
  }

  async getOpenInvoices(accountId: string| null, lookupCode: string): Promise<Invoice[]> {
    const url = `https://${this.subdomain}.instechpay.co/portal-v1/get-open-invoices`;
    const body = {
      AccountId: accountId??-1,
      LookupCode: lookupCode
    };

    return await this.svc.post<Invoice[]>(url, body);
  }

  async getSurcharge(clientLookupCode: string): Promise<{ surcharge: number; vendorSurcharge: number }> {
    const url = `https://${this.subdomain}.instechpay.co/portal-v1/get-surcharge`;
    const body= { ClientLookupCode: clientLookupCode };

    return await this.svc.post<{ surcharge: number; vendorSurcharge: number }>(url, body);

  }
   async  listPaymentMethods(AccountCode: string, subdomain : string): Promise<any[]> {
    const requestBody = {
       AccountCode: AccountCode
    };

   return await this.svc.post(`https://${subdomain}.instechpay.co/portal-v1/list-payment-methods`, requestBody);
}

  async saveSurcharge(items: SurchargeItem[]): Promise<string> {
    const url = `https://${this.subdomain}.instechpay.co/portal-v1/save-surcharge`;
    await this.svc.post(url, { items });

    return 'Success';
  }

  async getSubdomain(epicSubdomain: string, accountLookupCode: string): Promise<string> {
    const url = `https://ins-dev.instechpay.co/pay/get-subdomain?subdomain=${epicSubdomain}&accountid=${accountLookupCode}`;
    const response = await fetch(url);
    return await response.text();
  }
}

export function getCurrentAccountID(): string | null {
  const hash = window.location.hash;
  const hashUrl = new URL('https://dummy.com' + hash.slice(1));
  const params = new URLSearchParams(hashUrl.search);
  const dataParam = params.get('data');

  if (dataParam) {
    try {
      const dataObj = JSON.parse(decodeURIComponent(dataParam));
      return dataObj.A;
    } catch (err) {
      console.error('Failed to parse data parameter:', err);
    }
  }
  
  return null;
}

export function getAccountLookupCode(): string {
  const container = document.querySelector('[data-automation-id="streLookupCode"]');
  
  if (container) {
    const asiElement = container.querySelector('asi-string-edit .string-edit');
    
    if (asiElement) {
      const value = asiElement.getAttribute('data-value');
      return value || '';
    }
  }
  
  return '';
}










export async function createTransaction(transaction: any, subdomain:string, isCheck:boolean )
{
  const urlendpoint = isCheck?"make-check-payment-to-cardknox":"make-payment-cardknox"

  const response = await fetch(`https://${subdomain}.instechpay.co/pay/${urlendpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(transaction),
    });

    if (!response.ok) {
        throw new Error("Failed to create transaction");
    }

    return response.json();

}