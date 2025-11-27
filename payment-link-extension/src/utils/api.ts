import { Client, Invoice, SurchargeItem } from '../types';

export class ApiService {
  private subdomain: string;

  constructor(subdomain: string) {
    this.subdomain = subdomain;
  }

  async getClientFromEpic(clientId: string): Promise<Client> {
    const url = `https://${this.subdomain}.instechpay.co/pay/get-client-from-epic?ClientID=${clientId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    
    return await response.json();
  }
  async getClientFromEpicWithLookup(lookupCode: string): Promise<Client> {
    const url = `https://${this.subdomain}.instechpay.co/pay/get-client-from-epic?LookupCode=${lookupCode}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    
    return await response.json();
  }

  async getOpenInvoices(accountId: string| null, lookupCode: string): Promise<Invoice[]> {
    const url = `https://${this.subdomain}.instechpay.co/pay/get-open-invoices`;
    const body = {
      AccountId: accountId??-1,
      LookupCode: lookupCode
    };

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  }

  async getSurcharge(clientLookupCode: string): Promise<{ surcharge: number; vendorSurcharge: number }> {
    const url = `https://${this.subdomain}.instechpay.co/pay/get-surcharge`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ ClientLookupCode: clientLookupCode }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  }

  async saveSurcharge(items: SurchargeItem[]): Promise<string> {
    const url = `https://${this.subdomain}.instechpay.co/pay/save-surcharge`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(items),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

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


export async function listPaymentMethods(AccountCode: string, subdomain : string) {
    const requestBody = {
       AccountCode: AccountCode
    };

    const response = await fetch(`https://${subdomain}.instechpay.co/pay/list-payment-methods`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error("Failed to list payment methods");
    }

    return response.json();
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