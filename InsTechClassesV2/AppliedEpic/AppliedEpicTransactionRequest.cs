using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;



namespace InsTechClassesV2.AppliedEpic
{
   public class AppliedEpicTransactionRequest
    {
        private static string _url = "https://api.myappliedproducts.com/sdk/v1/transactions";

        public AppliedEpicTransactionRequest(int accountId,  int invoiceNumber)
        {
            AccountId = accountId;
            InvoiceNumber = invoiceNumber;
        }

        public int AccountId { get; set; }
        public int TransactionId { get; set; } 
        public int InvoiceNumber { get; set; }


        public static async Task<List<Transaction>?> GetTransactionsFromEpic(Vendor vendor , Dictionary<string, string> filters)
        {
            var epicTransaction = await AppliedApiClient.GetObject(_url, filters, vendor);
            string jsonString = await epicTransaction.Content.ReadAsStringAsync();
            jsonString = Utilities.RemoveNilProperties(jsonString);
            if (!epicTransaction.IsSuccessStatusCode) return null; 
            var response = Newtonsoft.Json.JsonConvert.DeserializeObject<AppliedEpicTransaction>(jsonString);
            return response?.Envelope?.Body?.Get_TransactionResponse?.Get_TransactionResult?.Transactions?.Transaction;
        }

        public async Task GetTransactionFromEpicForApplyInvoice(Vendor vendor)
        {
          var queryParams = new Dictionary<string, string>
            {
                { "AccountID", AccountId.ToString() },
                { "InvoiceNumber", InvoiceNumber.ToString() },
                { "AccountTypeCode", "CUST" },
                { "TransactionStatus", "OpenItem" }

            };
            var epicTransaction = await GetTransactionsFromEpic(vendor, queryParams);
            this.TransactionId = epicTransaction[0].TransactionID;
            
        }
    }
}
