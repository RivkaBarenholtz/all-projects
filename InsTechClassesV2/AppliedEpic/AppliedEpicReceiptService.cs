using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;

using System.Threading.Tasks;
using static InsTechClassesV2.AppliedEpic.AppliedEpicReceipt;
using InsTechClassesV2.AppliedEpic;
using InsTechClassesV2.Cardknox;
using AmazonUtilities;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Numerics;
using Amazon.Runtime.Internal.Util;
using System.Security;
using System.Security.AccessControl;
using Amazon.SecretsManager.Model.Internal.MarshallTransformations;
using Amazon.SimpleEmail.Model;
using InsTechClassesV2.Api;
using System.ComponentModel.Design;


namespace InsTechClassesV2.AppliedEpic
{
    public class AppliedEpicReceiptService
    {
        public static Receipt CreateNewReceipt(int bankAccountNumberCode, string accountNum, decimal amount,decimal amountSwallowed,  string clientLookupCode, string refNum, string batchNumber, AppliedGetClientRequest client, string agencyCode, PaymentMethod method,  DebitCredit debitCredit, string description )
        {
            var paymentReceipt = new Receipt();
            paymentReceipt.ReceiptEffectiveDate = DateTime.Now;
            paymentReceipt.BankAccountNumberCode = bankAccountNumberCode;
            paymentReceipt.ReceiptDescription = description;
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
                DetailItemAccountLookupCode = SecurityElement.Escape(clientLookupCode),
                ApplyTo = "Account",
                Description = $"{(debitCredit == DebitCredit.Credit?"Pymt":"Rfnd/void")}- acct {accountNum} for ref num {refNum}",
                StructureAgencyCode = SecurityElement.Escape(agencyCode),
                StructureBranchCode = SecurityElement.Escape(client.BranchCode),
                Method= (method==PaymentMethod.CreditCard? "Credit Card":method.ToString()),
                DebitCreditOption = new DebitCreditOption() { OptionName = debitCredit.ToString(), Value = (int)debitCredit },
                PaymentID = refNum
            }) };

            if (amountSwallowed > 0)
            {
                paymentReceipt.DetailValue.DetailItemsValue.DetailItem.Add(new DetailItem
                {
                    Amount = amountSwallowed,
                    DebitCreditOption = new DebitCreditOption() { OptionName = "Debit", Value = 0 },
                    DetailItemAccountLookupCode = SecurityElement.Escape(client.LookupCode),
                    ApplyTo = "Account",
                    Description = $"CC surcharge swallowed for pymt",
                    IsBankAccount = false,
                    Method = "Credit Card",
                    StructureAgencyCode = SecurityElement.Escape(agencyCode),
                    StructureBranchCode = SecurityElement.Escape(client.BranchCode)

                });
            }
            return paymentReceipt;
        }
        public async static Task ApplyDetailToInvoice(Receipt receipt, int invoiceNumber, string  _lookupCode, Vendor vendor, int detailId, GlobalLog log)
        {
            var client = await AppliedGetClientRequest.Create(_lookupCode, vendor, new GlobalLog());

            var transaction = new AppliedEpicTransactionRequest(client.ClientID, invoiceNumber);
            await transaction.GetTransactionFromEpicForApplyInvoice(vendor);
            var detail = receipt.DetailValue.DetailItemsValue.DetailItem.Where(x => x.DetailItemID == detailId).FirstOrDefault();
            if (detail != null  )
            {
                detail.ApplyToSelectedItemsApplyCreditsToDebits.Debits.DebitItem = new List<DebitItem>() { new DebitItem() { InvoiceNumber = invoiceNumber, TransactionID = transaction.TransactionId } };       
                detail.ApplyTo = "Receivables";
                detail.Flag = "Update";
            }
            
            var response = await UpdateApplied(receipt, vendor);
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"We successfully applied a   payment to invoice  { invoiceNumber} in Applied Epic for client {client.ClientName}. ");

                log.InvoiceMessage = $"Payment applied to invoice # {invoiceNumber} ";
            }
            else
            {
                log.AddToLog($"Unable to apply payment to invoice { invoiceNumber} in Applied Epic for client {client.ClientName}. Error from Applied is {response.Content}");
            }
        }
        public async static Task<string> AddNewDetailToReceiptAndUpdateApplied(Receipt receipt, Vendor vendor, string acctNum, decimal amount,decimal amountSwallowed,  AppliedGetClientRequest client, string refNum, string agencyCode,  GlobalLog logger, PaymentMethod method, DebitCredit debitCredit)
        {
            foreach (var item in receipt.DetailValue.DetailItemsValue.DetailItem)
            {
                item.Flag = "View";
                item.StructureAgencyCode = SecurityElement.Escape(item.StructureAgencyCode);
                item.StructureBranchCode = SecurityElement.Escape(item.StructureBranchCode);
                item.DetailItemAccountLookupCode = SecurityElement.Escape(item.DetailItemAccountLookupCode);
            }

            receipt.DetailValue.DetailItemsValue.DetailItem.Add(new DetailItem
            {
                Amount = amount,
                DetailItemAccountLookupCode = SecurityElement.Escape(client.LookupCode),
                ApplyTo = "Account",
                Description = $"{(debitCredit == DebitCredit.Credit?"Pymt":"Rfnd/void")}- acct {acctNum} for ref num {refNum}",
                IsBankAccount = false,
                Flag = "Insert",
                StructureAgencyCode = SecurityElement.Escape(agencyCode),
                StructureBranchCode = SecurityElement.Escape(client.BranchCode),
                PaymentID= refNum,
                Method = (method == PaymentMethod.CreditCard ? "Credit Card" : method.ToString()),
                DebitCreditOption = new DebitCreditOption() { OptionName = debitCredit.ToString(), Value = (int)debitCredit }

            });

            if (amountSwallowed > 0)
            {
                receipt.DetailValue.DetailItemsValue.DetailItem.Add(new DetailItem
                {
                    Amount = amountSwallowed,
                    DebitCreditOption =  new DebitCreditOption() { OptionName = "Debit", Value = 0 }, 
                    DetailItemAccountLookupCode = SecurityElement.Escape(client.LookupCode),
                    ApplyTo = "Account",
                    Description = $"CC surcharge swallowed for pymt",
                    IsBankAccount = false,
                    Flag = "Insert",
                    StructureAgencyCode = SecurityElement.Escape(agencyCode),
                    StructureBranchCode = SecurityElement.Escape(client.BranchCode)

                });
            }

            receipt.DetailValue.Total += amount;
            var response = await UpdateApplied(receipt, vendor);
            if (response.IsSuccessStatusCode)
            {
                return "Success";
            }
            else
            {
                var message = await response.Content.ReadAsStringAsync();
                return message;
            }
        }
        public static async Task<string > GetBatchName (string refNumber, Vendor vendor , DebitCredit debitCredit, string currentCommand)
        {
            string key = await SecretManager.GetSecret(vendor.CardknoxApiKeySecretName);
            var cardknox = await new CardknoxTransactionReportApiRequest(refNumber, key).GetCardknoxTransactionReportResponse(vendor);
            string batch = cardknox.ReportData.Count > 0 ? cardknox.ReportData[0].ResponseBatch : "";
            TimeZoneInfo estZone = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
            DateTime estTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, estZone);


            DateTime dateTime = cardknox.ReportData.Count > 0 ? Convert.ToDateTime(cardknox.ReportData[0].EnteredDate) : estTime;

            string command = cardknox.ReportData.Count > 0 ? cardknox.ReportData[0].Command.ToLower() : "";
            if (command.Contains("check"))
            {
                string negativeDeposit = "";
                if (!currentCommand.Contains("void") && debitCredit == DebitCredit.Debit)
                {
                    negativeDeposit = "-Debits";
                }
                batch = $"{dateTime.AddHours(3).Date.ToString("yyyyMMdd")}-{vendor.CardknoxAccountCode}{negativeDeposit}";
            }
            return batch;
        }

        public static async Task<BatchReceipt?> GetBatch(string refNumber, Vendor vendor, List<BatchReceipt> batchList, DebitCredit debitCredit,string  currentCommand)
        {
            var batch = "";
            if ((currentCommand.Contains("Wire")))
            {
                batch = refNumber;
            }
            else  batch = await GetBatchName(refNumber, vendor, debitCredit, currentCommand);
            
            if (batch == "") return null;
            var correctBatch = batchList.Where(x => x.BatchId == batch).FirstOrDefault();
            if (correctBatch != null) return correctBatch;
            var newBatch = new BatchReceipt(batch, -1);
            batchList.Add(newBatch);
            return newBatch;
        }
        public static async Task<HttpResponseMessage> GetReceiptFromApplied(int receiptID, Vendor vendor)
        {
            Dictionary<string, string> pairs = new Dictionary<string, string>();
            // pairs.Add("TransactionStatus", "OPEN");
            return await AppliedApiClient.GetObject($"{_url}/{receiptID}", pairs, vendor);
        }

        public static async Task<Receipt?> GetUpdatedReceiptFromApplied( int receiptId , Vendor vendor)
        {
            var updatedReceipt = await AppliedEpicReceiptService.GetReceiptFromApplied(receiptId, vendor);
            var json = await updatedReceipt.Content.ReadAsStringAsync();
            json = Utilities.RemoveNilProperties(json);
            AppliedEpicReceipt.ReceiptFilterResponse? appliedPaymentResponse = JsonConvert.DeserializeObject<AppliedEpicReceipt.ReceiptFilterResponse>(json);
            var receiptObject = appliedPaymentResponse?.Envelope?.Body?.Get_GeneralLedger_ReceiptResponse?.Get_GeneralLedger_ReceiptResult?.Receipts?.Receipt;
            return receiptObject;
        }
        public static async Task<HttpResponseMessage> UpdateApplied(Receipt receipt, Vendor vendor)
        {
           return await AppliedApiClient.PutObject(_url, receipt, vendor);
        }
        //public static async Task<Receipt> PostNewReceiptToAppliedScrape(GlobalLog log, Vendor vendor , string acctNum , decimal amount, decimal amountSwallowed, AppliedGetClientRequest client, string refNum, string batchNumber, PaymentMethod method, DebitCredit debitCredit)
        //{
        //   var scrapeReceiptRequest = 
        //}
        public static async Task PostNewReceiptViaScrapeFunction (GlobalLog log , ScrapeAppliedEpicReceipt request, Vendor vendor)
        {
            var response = await ApiClient.CallApiAsync("http://api.instechpay.co/add-new-receipt", HttpMethod.Post, new Dictionary<string, string>(), request, null, new Dictionary<string, string>());
            if (response.IsSuccessStatusCode) {
                Console.WriteLine($"We successfully created a new Receipt in Applied Epic via scrape method. Status is suspended and payment was not applied to any invoice.");
            }
            else
            {
                var responseString = await response.Content.ReadAsStringAsync();
                log.AddToLog($"No receipt was created in Applied Epic via scrape method. Response received: {responseString}");
            }

        }
        public static async Task<Receipt?> PostNewReceiptToApplied(GlobalLog log, Vendor vendor, string acctNum, decimal amount,decimal amountSwallowed,  AppliedGetClientRequest client, string refNum, string batchNumber, PaymentMethod method, DebitCredit debitCredit, string description)
        {
            var receipt = CreateNewReceipt(vendor.DepositBankAccountId, acctNum, amount,amountSwallowed, client.LookupCode, refNum, batchNumber, client, vendor.AgencyCode, method, debitCredit, description);
           
           
           
            var response = await AppliedApiClient.PostObject(_url, receipt, vendor);
            var responseString = await response.Content.ReadAsStringAsync();

            if(response.StatusCode == System.Net.HttpStatusCode.InternalServerError && (responseString.Contains("Agency Code not found")||responseString.Contains("Lookup code not found")) && vendor.SecondaryAgencyCode != null && vendor.SecondaryAgencyCode != "")
            {
                Console.WriteLine($"We couldn't create a new receipt using the standard vendor agency code. Trying again vendors secondary agency code.({vendor.SecondaryAgencyCode})");
                receipt.DetailValue.DetailItemsValue.DetailItem[0].StructureAgencyCode = SecurityElement.Escape(vendor.SecondaryAgencyCode);
                response = await AppliedApiClient.PostObject(_url, receipt, vendor);
                responseString = await response.Content.ReadAsStringAsync();
            }
            if(response.StatusCode == System.Net.HttpStatusCode.InternalServerError && (responseString.Contains("Agency Code not found") || responseString.Contains("Lookup code not found.")) && !string.IsNullOrEmpty(vendor.DummyAccountCode))
            {
                Console.WriteLine($"We couldn't create a new receipt using the standard vendor agency code. Submitting with default account code. ");
                log.ClientFoundDisplay = "none";
                log.ClientNotFoundDisplay = "block";
                log.AccountID = vendor.DummyAccountCode;
                var c = await AppliedGetClientRequest.Create(vendor.DummyAccountCode, vendor, log);

                receipt.DetailValue.DetailItemsValue.DetailItem[0].DetailItemAccountLookupCode = SecurityElement.Escape(vendor.DummyAccountCode);
                receipt.DetailValue.DetailItemsValue.DetailItem[0].StructureBranchCode = SecurityElement.Escape(c.BranchCode);
                receipt.DetailValue.DetailItemsValue.DetailItem[0].StructureAgencyCode= SecurityElement.Escape(vendor.AgencyCode);

                response = await AppliedApiClient.PostObject(_url, receipt, vendor);
                responseString = await response.Content.ReadAsStringAsync();
            }

            if (response.IsSuccessStatusCode)
            {
                var responseJson = JObject.Parse(responseString);

                receipt.ReceiptID = (int)responseJson["Envelope"]?["Body"]?["Insert_GeneralLedger_ReceiptResponse"]?["Insert_GeneralLedger_ReceiptResult"];
                Console.WriteLine($"We successfully created a new Receipt in Applied Epic with id {receipt.ReceiptID}. Status is suspended and payment was not applied to any invoice.");
                log.ReceiptID = receipt.ReceiptID.ToString();
            }
            else
            {
                
                log.ReceiptDisplay = "none";
                log.ErrorDisplay = "block";
                log.ErrorText = $"No receipt was created in Applied Epic . Response received from Applied Epic: {responseString}";
                Console.WriteLine(log.ErrorText);
                return null;
            }
            return receipt;
        }
        public static async Task<string> GetCSREmailAddress (string CSRLookupCode, Vendor vendor)
        {
            if (CSRLookupCode == ""|| CSRLookupCode == null ) return "";
            string url = "https://api.myappliedproducts.com/sdk/v1/employees";
            Dictionary<string, string > queryParams = new Dictionary<string, string>() { {"QueryValue", CSRLookupCode }, {"SearchType", "LookupCode" }, {"IncludeActive","true" } };
            var response = await AppliedApiClient.GetObject(url, queryParams,vendor );
            var responseString = await response.Content.ReadAsStringAsync();
            JObject obj = JObject.Parse(responseString);

            string email = (string)obj["Envelope"]?["Body"]?["Get_EmployeeResponse"]?["Get_EmployeeResult"]?["Employees"]?["Employee"]?["AccountValue"]?["EmailAddress"]?? "";

            return email;
        }

        private static string _url = "https://api.myappliedproducts.com/sdk/v1/general-ledger-receipts";

        public static async Task<string> SubmitPaymentToEpic(string BillLastName, Vendor vendor , GlobalLog logger, List<string > emailList,string TransResponse, string RefNum, string Invoice , decimal Amount, decimal SwallowedAmount,  string CardNumber, PaymentMethod method, DebitCredit debitCredit, string currentCommand )
        {
            AppliedGetClientRequest? appliedClient = null;
            if (BillLastName != "")
            {
                try
                    {
                        appliedClient = await AppliedGetClientRequest.Create(BillLastName, vendor, logger);

                        var agentEmail = await AppliedEpicReceiptService.GetCSREmailAddress(appliedClient?.CSRLookupCode, vendor);
                        emailList.Add(agentEmail);
                    }
                    catch (Exception ex)
                    {
                        //logger.AddToLog($"Unable to get client data. {ex.Message} {ex.StackTrace}");
                        if (vendor.DummyAccountCode == null || vendor.DummyAccountCode == "")
                        {
                            return $"ERROR: Unable to get client data. {ex.Message} {ex.StackTrace}";
                        }
                    }

                
                Console.WriteLine($"Client entered account name: {BillLastName}");

                
            }
            if (appliedClient == null && vendor.DummyAccountCode != null && vendor.DummyAccountCode != "")
            {
                Console.WriteLine($"No client found. Using dummy account. Lookup code: {vendor.DummyAccountCode}");
                logger.ClientNotFoundDisplay = "block";
                logger.ClientFoundDisplay = "none";
                
                appliedClient = await AppliedGetClientRequest.Create(vendor.DummyAccountCode, vendor, logger);

            }
            logger.AccountID = appliedClient?.LookupCode ?? "";
            logger.AccountName = appliedClient?.ClientName ?? "";
            if (TransResponse.ToUpper() == "APPROVED")
            {
                try
                {
                    int receiptId = -1;
                    bool newReceipt = false;
                    List<BatchReceipt> batchList = new List<BatchReceipt>();
                    BatchReceipt? batchReceipt = null;
                    var s3Bucket = new AmazonUtilities.AmzS3Bucket(vendor.s3BucketName, "ReceiptBatches.json");


                    batchList = await s3Bucket.QueryJsonLinesAsync<BatchReceipt>("1 = 1");

                    if (!vendor.CreateNewReceipt)
                    {
                        batchReceipt = await AppliedEpicReceiptService.GetBatch(RefNum, vendor, batchList, debitCredit, currentCommand);
                    }
                    
                    receiptId = batchReceipt?.ReceiptId ?? -1;
                    Console.WriteLine($"This payment with ref num {RefNum} found for batch {batchReceipt?.BatchId}");
                    logger.RefNum = RefNum;
                    logger.BatchNumber = batchReceipt?.BatchId ?? "";

                    Console.WriteLine($"Payment recieved from  {BillLastName} for invoice {Invoice} with amount {Amount} ref num {RefNum}.");
                    logger.InvoiceNumber = Invoice;
                    logger.Amount = Amount.ToString();
                    logger.EnteredName = BillLastName; 
                    Receipt? receiptObject= null;

                    if (receiptId > 0) receiptObject = await AppliedEpicReceiptService.GetUpdatedReceiptFromApplied(receiptId, vendor);

                    if (receiptId == -1 || receiptObject?.FinalizedReceipt?.ToLower()== "true" )
                    {
                        string receiptDescription = $"New Receipt created for batch # {batchReceipt?.BatchId??RefNum}";
                        if (currentCommand == "Wire Funds")
                        {
                            receiptDescription = $"Wire Funds Receipt for ref num {RefNum}";
                        }


                        AppliedEpicReceipt.Receipt? receipt = await AppliedEpicReceiptService.PostNewReceiptToApplied(logger, vendor, CardNumber, Amount, SwallowedAmount, appliedClient, RefNum, $"{(string.IsNullOrEmpty(batchReceipt?.BatchId)?RefNum : batchReceipt?.BatchId) }{(receiptId > 0 ? "-2" : "")}", method, debitCredit, receiptDescription);
                            newReceipt = true;
                            receiptId = receipt?.ReceiptID ?? -1;
                            if (batchReceipt != null && receiptId != -1) batchReceipt.ReceiptId = receiptId;
                            await s3Bucket.SaveAsJsonLinesAsync(batchList);
                            receiptObject = await AppliedEpicReceiptService.GetUpdatedReceiptFromApplied(receiptId, vendor);
                        
                    }
                   
                    
                    if (!newReceipt)
                    {
                        string result = await AppliedEpicReceiptService.AddNewDetailToReceiptAndUpdateApplied(receiptObject, vendor, CardNumber, Amount, SwallowedAmount, appliedClient, RefNum,vendor.AgencyCode,  logger, method, debitCredit);
                        if ( (result.Contains("Agency Code not found") || result.Contains("Lookup code not found.") )&&  vendor.SecondaryAgencyCode != null && vendor.SecondaryAgencyCode != "" )
                        {
                            Console.Write($"We couldn't enter payment using the standard vendor agency code. Trying again vendors secondary agency code.({vendor.SecondaryAgencyCode})"); 
                            result = await AppliedEpicReceiptService.AddNewDetailToReceiptAndUpdateApplied(receiptObject, vendor, CardNumber, Amount, SwallowedAmount, appliedClient, RefNum, vendor.SecondaryAgencyCode, logger, method, debitCredit);
                        }
                        if ((result.Contains("Agency Code not found") || result.Contains("Lookup code not found.")) && ! string.IsNullOrEmpty(vendor.DummyAccountCode) )
                        {
                            var c = await AppliedGetClientRequest.Create(vendor.DummyAccountCode, vendor, logger);
                            Console.Write($"We couldn't enter payment using the standard vendor agency code. Applying to default accountt.({vendor.DummyAccountCode})"); 
                            result = await AppliedEpicReceiptService.AddNewDetailToReceiptAndUpdateApplied(receiptObject, vendor, CardNumber, Amount, SwallowedAmount, c, RefNum, vendor.AgencyCode, logger, method, debitCredit);
                        }
                        
                        if (result == "Success")
                        {
                            logger.ReceiptID = receiptObject?.ReceiptID.ToString(); 
                            Console.Write($"We successfully added a new detail to open receipt {receiptObject?.ReceiptID} in Applied Epic for client {appliedClient?.ClientName}. Amount: { Amount}. Amount not yet applied to any invoice.");
                        }
                        else if (result.Contains("user has taken a lock on the associated object") || result.Contains("call failed since another user has taken a lock on the same area"))
                        {
                            return $"Needs Retry for {receiptObject.ReceiptDescription}";
                        }
                        else
                        {
                            logger.ErrorDisplay = "block";
                            logger.ReceiptDisplay = "none";
                            logger.ErrorText = $"Unable to apply payment to open receipt {receiptObject?.ReceiptID} in Applied Epic for client {appliedClient?.ClientName}. Amount: {Amount}. Error from Applied is {result}";
                            Console.Write(logger.ErrorText);
                        }
                    }
                    if (int.TryParse(Invoice, out int invoiceNumber))
                    {
                        try
                        {
                            receiptObject = await AppliedEpicReceiptService.GetUpdatedReceiptFromApplied(receiptId, vendor);
                            await AppliedEpicReceiptService.ApplyPaymentToInvoice(invoiceNumber, receiptId, receiptObject.DetailValue.DetailItemsValue.DetailItem.Find(dt => dt.Description.Contains(RefNum) && dt.DebitCreditOption.OptionName == debitCredit.ToString()), vendor, logger);

                        }
                        catch (Exception ex)
                        {
                        }
                    }

                }
                catch (Exception ex)
                {
                    
                    logger.AddToLog($"Error: {ex.Message}");
                    return $"Error: {ex.Message}";
                }

                return "Success";


            }
            return "Transaction not approved. No payment applied.";

        }
  
        public static async Task<string> ApplyPaymentToInvoice ( int invoiceNumber , int receiptId , DetailItem detail, Vendor vendor, GlobalLog log)
        {
            string Status = "Failed";
            string url = $"https://api.myappliedproducts.com/sdk/v1/general-ledger-receipts-default-apply-credits-to-debits/{receiptId}";
            detail.StructureAgencyCode = SecurityElement.Escape(detail.StructureAgencyCode);
            detail.StructureBranchCode = SecurityElement.Escape(detail.StructureBranchCode);
            detail.ApplyTo = "Receivables";
            var detailIdToDelete = detail.DetailItemID; 
            detail.DetailItemID = -1;
            var response = await AppliedApiClient.PostObject(url, detail, vendor);
            var rspString = await response.Content.ReadAsStringAsync();
            if (response.IsSuccessStatusCode)
            {
                string json = Utilities.RemoveNilProperties(rspString);
                ReceiptApplyDebitsToCreditsFilterResponse? appliedPaymentResponse = JsonConvert.DeserializeObject<ReceiptApplyDebitsToCreditsFilterResponse>(json);
                var receipt = appliedPaymentResponse?.Envelope?.Body?.Get_GeneralLedger_ReceiptDefaultApplyCreditsToDebitsResponse?.Get_GeneralLedger_ReceiptDefaultApplyCreditsToDebitsResult?.Receipts?.Receipt;
                if (receipt != null) {

                    foreach (var det in receipt.DetailValue.DetailItemsValue.DetailItem)
                    {
                        det.StructureAgencyCode = SecurityElement.Escape(det.StructureAgencyCode);
                        det.StructureBranchCode = SecurityElement.Escape(det.StructureBranchCode);
                    }

                    receipt.DetailValue.DetailItemsValue.DetailItem.Find(DetailItem => DetailItem.DetailItemID == detailIdToDelete).Flag = "Delete";
                    var newDetail = receipt.DetailValue.DetailItemsValue.DetailItem.Find(DetailItem => DetailItem.DetailItemID == 0 || DetailItem.DetailItemID == -1);
                    newDetail.Flag = "Insert";
                    newDetail.ApplyTo= "Receivables";
                    var correctCredit = newDetail.ApplyToSelectedItemsApplyCreditsToDebits.Credits.CreditItem.Where(x => x.TransactionID == -1).FirstOrDefault();
                    var correctDebit = newDetail.ApplyToSelectedItemsApplyCreditsToDebits.Debits.DebitItem.Where(x => x.InvoiceNumber == invoiceNumber).ToList();

                    var payments = correctDebit.Select(x => new PaymentItem { ApplyToDebitTransactionID = x.TransactionID }).ToList();
                    correctCredit.Payments = new Payments()
                    {
                        PaymentItem = payments
                    };
                    var updateResponse = await UpdateApplied(receipt, vendor);
                    if (updateResponse.IsSuccessStatusCode)
                    {
                        Status = "Success";
                        Console.WriteLine($"We successfully applied payment detail {detail.DetailItemID} to invoice {invoiceNumber} in Applied Epic for receipt {receiptId}.");
                        log.InvoiceMessage = $"Payment applied to invoice # {invoiceNumber} ";
                    }
                    else
                    {
                        Console.WriteLine($"Unable to apply payment detail {detail.DetailItemID} to invoice {invoiceNumber} in Applied Epic for receipt {receiptId}. Response from Applied Epic: {await updateResponse.Content.ReadAsStringAsync()}");
                    }


                }
                else
                {
                    Console.WriteLine("Unable to apply payment detail {detail.DetailItemID} to invoice {invoiceNumber} in Applied Epic for receipt {receiptId}.");
                }
              

            }
            else
            {
               Console.WriteLine($"Unable to apply payment detail {detail.DetailItemID} to invoice {invoiceNumber} in Applied Epic for receipt {receiptId}. Response from Applied Epic: {rspString}");
            }

            return Status; 
        }
    
    }

}

