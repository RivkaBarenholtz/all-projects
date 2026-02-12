using Amazon.Runtime;
using Amazon.SecretsManager.Model.Internal.MarshallTransformations;
using InsTechClassesV2;
using InsTechClassesV2.AppliedEpic;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechReceivePayment
{
    public static class AppliedEpicDataService
    {
        public static async Task<string> GetSubdomain(string epicSubdomain, string lookupCode)
        {
            // get vendor list 
            var vendorList = await Utilities.GetVendorListAsync();
            var vendor = vendorList.FirstOrDefault(v => !v.Exclude &&  v.EpicSubdomain.Equals(epicSubdomain, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrEmpty(lookupCode))
            {
                try { 
                var client = await AppliedGetClientRequest.Create(lookupCode, vendor, new GlobalLog());
                var vendorFromClient = vendorList.Where(v => client.AgencyCode.Contains(v.AgencyCode) || client.AgencyCode.Contains(v.SecondaryAgencyCode));
                    if (vendorList.Count > 0 )
                    {
                        return vendorFromClient.FirstOrDefault()?.subdomain??vendor.subdomain;
                    }
                }
                catch { }
            }

            return vendor.subdomain;  ;
        }

        public static async Task<List<dynamic>> GetCardknoxAccounts(Vendor vendor, string lookupCode)
        {
            try
            {
                var client = await AppliedGetClientRequest.Create(lookupCode, vendor, new GlobalLog());
                var vendorList = await Utilities.GetVendorListAsync();
                var vendorFromClient = vendorList.Where(v => !v.Exclude && (client.AgencyCode.Contains(v.AgencyCode) || client.AgencyCode.Contains(v.SecondaryAgencyCode))) ;

                // Return a list of dynamic objects with the required property
                return vendorFromClient.Select(v => new
                {
                    v.CardknoxAccountCode,
                    Subdomain = v.subdomain, 
                    AgencyCode = $"{v.AgencyCode}{(!string.IsNullOrEmpty(v.SecondaryAgencyCode)?$"/{v.SecondaryAgencyCode}":"")}"
                }).Distinct().Cast<dynamic>().ToList();
            }
            catch(Exception ex)
            {
                Console.WriteLine(ex.StackTrace);
                Console.WriteLine(ex.Message);
                // Return an empty list in case of an exception
                return new List<dynamic> { new {  vendor.CardknoxAccountCode, Subdomain = vendor.subdomain } };
            }
        }

        public static async Task<List<Invoice>> GetInvoiceList(Vendor vendor , string requestBody)
        {
            var InvoiceRequest =  Newtonsoft.Json.JsonConvert.DeserializeObject<InsTechClassesV2.TransactionRequests.InvoiceRequest> (requestBody);
            if (InvoiceRequest == null) throw new Exception("Invalid Request");
            if (InvoiceRequest.AccountId <= 0)
            {
                var client = await AppliedGetClientRequest.Create(InvoiceRequest.LookupCode, vendor, new GlobalLog());
                InvoiceRequest.AccountId = client.ClientID;
            }
            return await GetInvoiceList(vendor, InvoiceRequest.AccountId, InvoiceRequest.LookupCode);
        }
        private static async Task<List<Invoice>> GetInvoiceList(Vendor vendor, int accountID , string lookupCode )
        {
            Dictionary<string, string> parameters = new Dictionary<string, string>()
            {
                {"AccountID", accountID.ToString()  },
                {"TransactionStatus", "OpenItem" },
                {"BalanceComparisonType", "DoesNotEqual" },
                //{"InvoiceLastGeneratedDateBegins", "2020-01-01T00:00:00" },
                {"Balance", "0" },
                {"AccountTypeCode", "CUST"  }
            };
            List<Transaction> EpicTransactions = await AppliedEpicTransactionRequest.GetTransactionsFromEpic(vendor, parameters);
            if (EpicTransactions == null)
            {
                return new List<Invoice>(); 
            }
            var groups = EpicTransactions.GroupBy(x => x.InvoiceValue.SendInvoiceTos.SendInvoiceToItem?.InvoiceNumber??0);
            var invoices = groups.Select(x => new Invoice() 
            { 
                AppliedEpicInvoiceNumber = x.Key, 
                Balance = x.Sum(a => a.Balance) , 
                InvoiceTotal = x.Sum(a => a.TransactionAmount), 
                AgencyCode = x.FirstOrDefault()?.BillingValue?.AgencyCode??vendor.AgencyCode   ,
                PolicyId = x.FirstOrDefault()?.PolicyID ?? "",
            }).ToList();

            var invoiceSurcharges = await  InvoiceSurcharge.LoadMany(vendor,  invoices.Select(x => x.AppliedEpicInvoiceNumber).ToList());
            var clientSurcharge = await  ClientSurcharge.Load(vendor, lookupCode);
            var vendorList = await Utilities.GetVendorListAsync(); 
            invoices.ForEach(x => 
                {
                    var associatedVendor = vendorList.FirstOrDefault(y => y.AgencyCode == x.AgencyCode || (y.SecondaryAgencyCode == x.AgencyCode && !string.IsNullOrEmpty(y.SecondaryAgencyCode)));
                    x.AgencySubdomain = associatedVendor?.subdomain ?? "";
                    x.AgencyCardknoxAcct = associatedVendor?.CardknoxAccountCode ?? "";
                    x.Surcharge = invoiceSurcharges.FirstOrDefault(y => y.InvoiceNumber == x.AppliedEpicInvoiceNumber)?.CustomSurcharge ?? clientSurcharge.CustomSurcharge ?? vendor.InsureTechFeePercentage;
                    x.IsEditable = invoiceSurcharges.FirstOrDefault(y => y.InvoiceNumber == x.AppliedEpicInvoiceNumber)?.IsEditable ?? false;
                });
            return invoices;
        }

        public static async Task<List<Invoice>?> GetInvoiceFromInvoiceNumberAndLookupCode(Vendor vendor,  string requestBody  )
        {
            var InvoiceRequest = Newtonsoft.Json.JsonConvert.DeserializeObject<InsTechClassesV2.TransactionRequests.InvoiceByNumberRequest>(requestBody);
            if (InvoiceRequest == null) throw new Exception("Invalid Request");
            
            if (InvoiceRequest?.AccountId <=0)
            {
                var client = await AppliedGetClientRequest.Create(InvoiceRequest.LookupCode, vendor, new GlobalLog());
                InvoiceRequest.AccountId = client?.ClientID??0;
            }
            var allInvoices = await GetInvoiceList(vendor, InvoiceRequest.AccountId, InvoiceRequest.LookupCode);
            return allInvoices.Where(c => InvoiceRequest.InvoiceNumber?.Contains(c.AppliedEpicInvoiceNumber)??false).ToList() ;
        }
    }
}
