using Amazon.Runtime.Internal.Util;
using Amazon.SecretsManager.Model.Internal.MarshallTransformations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTech
{
    public static class AppliedPaymentRecieveRequest
    {
        public static Receipt CreateNewReceipt(int bankAccountNumberCode, int invoiceNumber, decimal amount, string clientLookupCode, string refNum)
        {
            var paymentReceipt = new Receipt();
            paymentReceipt.ReceiptEffectiveDate = DateTime.Now;
            paymentReceipt.BankAccountNumberCode = bankAccountNumberCode;
            paymentReceipt.ReceiptDescription = $"Payment received for invoice {invoiceNumber} with ACC reference number {refNum}";
            paymentReceipt.ReceiptReferNumber = "Suspended";
            paymentReceipt.SuspendedReceipt = true;
            paymentReceipt.Timestamp = DateTime.Now;
            paymentReceipt.ReceiptAccountingMonth = DateTime.Now.ToString("yyyyMM");
            paymentReceipt.DetailValue = new DetailValue
            {
                Total = amount
            };
            paymentReceipt.DetailValue.DetailItemsValue.DetailItem = new List<DetailItem>(){(new DetailItem
            {
                Amount = amount,
                DetailItemAccountLookupCode = clientLookupCode,
                ApplyTo = "Account",
                Description = paymentReceipt.ReceiptDescription,
            }) };


            return paymentReceipt;
        }
        public async static Task AddNewDetailToReceiptAndUpdateApplied(Receipt receipt, Vendor vendor, int invoiceNumber, decimal amount, string clientLookupCode, string refNum)
        {
            receipt.DetailValue.DetailItemsValue.DetailItem.Add(new DetailItem
            {
                Amount = amount,
                DetailItemAccountLookupCode = clientLookupCode,
                ApplyTo = "Account",
                Description = $"Payment received for invoice {invoiceNumber} with ACC reference number {refNum}",
                IsBankAccount = false
            });
            receipt.DetailValue.Total += amount;
            await UpdateApplied(receipt, vendor);
        }
        public static async Task<BatchReceipt?> GetBatch( string refNumber, Vendor vendor, List<BatchReceipt> batchList)
        {
            var cardknox = await  new CardknoxTransactionApiRequest(refNumber).GetCardknoxTransactionReportResponse();
            string batch =  cardknox.ReportData.Count>0 ? cardknox.ReportData[0].ResponseBatch : "";
            if (batch == "") return null;
            var correctBatch = batchList.Where(x => x.BatchId == batch).FirstOrDefault();
            if (correctBatch != null) return correctBatch;
            var newBatch=  new BatchReceipt(batch, -1);
            batchList.Add(newBatch);
            return newBatch;
        }
        public static async Task<HttpResponseMessage> GetReceiptFromApplied( int receiptID , Vendor vendor)
        {
            Dictionary<string, string> pairs = new Dictionary<string, string>();
           // pairs.Add("TransactionStatus", "OPEN");
            return await AppliedApiClient.GetObject($"{_url}/{receiptID}",pairs, vendor);
        }

        public static async Task UpdateApplied( Receipt receipt, Vendor vendor)
        {
            await AppliedApiClient.PutObject(_url, receipt,vendor );
        }
        public static async Task<Receipt?> PostNewReceiptToApplied(GlobalLog log, Vendor vendor,  int invoiceNumber, decimal amount, string clientLookupCode, string refNum)
        {
            var receipt = CreateNewReceipt(vendor.DepositBankAccountId, invoiceNumber, amount, clientLookupCode, refNum);
            var client = await AppliedGetClientRequest.Create(clientLookupCode, vendor);
            if (client == null)
            {
                log.AddToLog($"No client found in Applied Epic for lookup code {clientLookupCode}. No payment receipt was created.");
                return null ;
            }
            else
            {
                log.AddToLog($"Client found in Applied Epic for lookup code {clientLookupCode}. Client is {client.ClientName}.");
            }
            receipt.DetailValue.DetailItemsValue.DetailItem[0].StructureBranchCode = client.BranchCode;
            receipt.DetailValue.DetailItemsValue.DetailItem[0].StructureAgencyCode = client.AgencyCode;

            var response =  await AppliedApiClient.PostObject(_url, receipt, vendor);
            if(response.IsSuccessStatusCode)
            {
                var responseString = await response.Content.ReadAsStringAsync();
                var responseJson = System.Text.Json.JsonDocument.Parse(responseString);

                receipt.ReceiptID = responseJson.RootElement.GetProperty("Envelope").GetProperty("Body").GetProperty("Insert_GeneralLedger_ReceiptResponse").GetProperty("Insert_GeneralLedger_ReceiptResult").GetInt32();
                log.AddToLog($"We successfully created a new Receipt in Applied Epic with id {receipt.ReceiptID}. Status is suspended and payment was not applied to any invoice.");
            }
            else
            {
                var responseString = await response.Content.ReadAsStringAsync();
                log.AddToLog($"No receipt was created in Applied Epic . Response received from Applied Epic: {responseString}");
                return null;
            }
            return receipt;
        }
        private  static string  _url = "https://api.myappliedproducts.com/sdk/v1/general-ledger-receipts";

       
    }
    //public class DetailValue
    //{
    //    public decimal Total { get; set; }
    //    public DetailItemsValue DetailItemsValue = new DetailItemsValue();
    //}
    //public class DetailItemsValue
    //{
    //    public List<DetailItem> DetailItem = new List<DetailItem>();
    //}
    //public class DetailItem
    //{
    //    public decimal Amount { get; set; }
    //    public string? ApplyTo { get; set; }
    //    public string? DetailItemAccountLookupCode { get; set; }
    //    public string? Description { get; set; }
    //    public string? StructureAgencyCode { get; set; }
    //    public string? StructureBranchCode { get; set; }

    //    public ApplyToSelectedItemsApplyCreditsToDebits ApplyToSelectedItemsApplyCreditsToDebits = new ApplyToSelectedItemsApplyCreditsToDebits();

    //}
    //public class CreditItem
    //{
    //    public int TransactionID { get; set; } = -1;
    //    public int? InvoiceNumber { get; set; }
    //}
    //public class Credits
    //{
    //    public List<CreditItem> CreditItem = new List<CreditItem>();
    //}
    //public class ApplyToSelectedItemsApplyCreditsToDebits
    //{
    //    public Credits Credits = new Credits();
    //}
}
