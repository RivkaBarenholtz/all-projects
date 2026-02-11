export interface Invoice {
  id: number;
  AppliedEpicInvoiceNumber: string;
  InvoiceTotal: number;
  Balance: number;
  Surcharge: number;
  IsEditable: boolean;
  AgencyCode: string;
  AgencySubdomain: string;
  PolicyId: number;
}

export interface Client {
  LookupCode: string;
  GUID? : string; 
  ClientName: string;
  EmailAddress?: string;
  CSREmailAddress?: string;
  PhoneNumber?:string;
  BillingAddress?:string ;
  BillingCity?:string ; 
  BillingState?:string ;
  BillingZip?:string ; 
  CardknoxCustomer?: CardknoxCustomer
}

export interface CardknoxCustomer 
{
  PaymentMethods: PaymentMethod[]
  CustomerId : string 
}

export interface PaymentMethod
{
  isDefault: boolean,
  MaskedAccountNumber: string , 
  CardType: string 
}
export interface SurchargeItem {
  ClientLookupCode: string;
  SurchargeAmount: number;
  InvoiceNumber?: string;
  IsEditable?: boolean;
}

export interface GlobalState {
  subdomain: string;
  invoiceData: Invoice[];
  Client: Client | null;
  Surcharge: number;
  vendorSurcharge: number;
  SelectedInvoices: Set<string>;
}
