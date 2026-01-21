import { Client, Invoice, SurchargeItem } from '../types';
import { ApiService as Service } from '../services/apiService';
import { Form } from 'lucide-react';

export class ApiService {
  private subdomain: string;
  private onUnauthorized?: () => void;
  private isDev: boolean = false;
  protected svc: Service; // Declare but don't initialize here

  constructor(isDev: boolean, subdomain: string, onUnauthorized?: () => void) {
    this.subdomain = subdomain;
    this.onUnauthorized = onUnauthorized;
    this.isDev = isDev;
    this.svc = new Service(this.onUnauthorized, this.isDev);
  }



  protected baseUrl = () => {
    if (this.isDev) return `http://127.0.0.1:3000/portal-v1/${this.subdomain}`;
    return `https://${this.subdomain}.instechpay.co/portal-v1/${this.subdomain}`
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
  async sendInvoiceEmail(body: string, attachment: File, subject: string, recipients: string[]): Promise<string> {
    const url = `${this.baseUrl()}/send-invoice-email`;

    // 1. Convert File to Base64
    const base64Data = await this.fileToBase64(attachment);

    // 2. Create a plain JSON payload
    const payload = {
      body: body,
      subject: subject,
      recipients: recipients,
      attachment: {
        name: attachment.name,
        type: attachment.type,
        data: base64Data // This will be the full Data URL (data:application/pdf;base64,...)
      }
    };

    // 3. Use a standard POST instead of postFormData
    // Ensure your svc.post method sets 'Content-Type': 'application/json'
    return await this.svc.post<string>(url, payload);

  }
  async getClientFromEpic(clientId: string): Promise<Client> {
    const url = `${this.baseUrl()}/get-client-from-epic?ClientID=${clientId}`;
    return await this.svc.get(url);


  }
  async getClientFromEpicWithLookup(lookupCode: string): Promise<Client> {
    const url = `${this.baseUrl()}/get-client-from-epic?LookupCode=${lookupCode}`;
    return await this.svc.get(url);
  }

  async getOpenInvoices(accountId: string | null, lookupCode: string): Promise<Invoice[]> {
    const url = `${this.baseUrl()}/get-open-invoices`;
    const body = {
      AccountId: accountId ?? -1,
      LookupCode: lookupCode
    };

    return await this.svc.post<Invoice[]>(url, body);
  }
  async getCardknoxAccounts(clientLookupCode: string): Promise<{ CardknoxAccountCode: string, Subdomain: string, AgencyCode: string }[]> {
    const url = `${this.baseUrl()}/get-cardknox-accounts?accountid=${clientLookupCode}`
    return await this.svc.get(url);
  }
  async getSurcharge(clientLookupCode: string): Promise<{ surcharge: number; vendorSurcharge: number }> {
    const url = `${this.baseUrl()}/get-surcharge`;
    const body = { ClientLookupCode: clientLookupCode };

    return await this.svc.post<{ surcharge: number; vendorSurcharge: number }>(url, body);

  }
  async listPaymentMethods(AccountCode: string, subdomain: string): Promise<any[]> {
    const requestBody = {
      AccountCode: AccountCode
    };

    return await this.svc.post(`${this.baseUrl()}/list-payment-methods-ext`, requestBody);
  }

  async saveSurcharge(items: SurchargeItem[]): Promise<string> {
    const url = `${this.baseUrl()}/save-surcharge`;
    await this.svc.post(url, items);

    return 'Success';
  }

  async getSubdomain(epicSubdomain: string, accountLookupCode: string): Promise<string> {
    const url = `https://ins-dev.instechpay.co/pay/get-subdomain?subdomain=${epicSubdomain}&accountid=${accountLookupCode}`;
    const response = await fetch(url);
    return await response.text();
  }

  async deletePaymentMethod(token: string): Promise<string> {
    const url = `${this.baseUrl()}/delete-payment-method-ext`;
    const body = {
      Token: token
    };
    return await this.svc.post(url, body);
  }

  async setDefaultPaymentMethod(token: string, accountCode: string): Promise<string> {
    const url = `${this.baseUrl()}/make-method-default`;
    const body = {
      Token: token,
      AccountId: accountCode
    };
    return await this.svc.post(url, body);
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










export async function createTransaction(transaction: any, subdomain: string, isCheck: boolean) {
  const urlendpoint = isCheck ? "make-check-payment-to-cardknox" : "make-payment-cardknox"

  const response = await fetch(`https://ins-dev.instechpay.co/pay/${subdomain}/${urlendpoint}`, {
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