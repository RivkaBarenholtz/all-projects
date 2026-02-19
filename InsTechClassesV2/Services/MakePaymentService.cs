using InsTechClassesV2;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using InsTechClassesV2.Cardknox;
using InsTechClassesV2.TransactionRequests;
using Newtonsoft.Json.Linq;
using AmazonUtilities;
using System.Globalization;
using InsTechClassesV2.AppliedEpic;
using AmazonUtilities.DynamoDatabase;
using System.Numerics;
using Amazon.Runtime.Internal;
using Amazon.DynamoDBv2.Model.Internal.MarshallTransformations;


namespace InsTechClassesV2.Services
{
    public class MakePaymentService
    {
        public async static Task<decimal> GetClientSurcharge(string requestBody, Vendor vendor)
        {
            SurchargeRequest? request = JsonConvert.DeserializeObject<SurchargeRequest>(requestBody);
            if (request == null) throw new Exception("Invalid request");
            return await GetClientSurcharge(request, vendor);

        }

        public async static Task<decimal> GetClientSurcharge(SurchargeRequest request, Vendor vendor)
        {
            if (request == null) return vendor.InsureTechFeePercentage;
            if (request?.InvoiceNumber > 0)
            {
                var invoice = await InvoiceSurcharge.Load(vendor, request.InvoiceNumber);
                if (invoice.CustomSurcharge != null)
                {
                    return invoice.CustomSurcharge.Value;
                }
            }

            var client = await ClientSurcharge.Load(vendor, request?.ClientLookupCode);
            var surcharge = client?.CustomSurcharge ?? vendor.InsureTechFeePercentage;
            return surcharge;

        }

        public async static Task<Boolean> VerifyCapthca(string token, Boolean isDev)
        {
            var secret = isDev ? "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe" : await SecretManager.GetSecret("recaptcha-secret");
            var client = new HttpClient();
            var values = new Dictionary<string, string>
            {
                { "secret", secret },
                { "response", token }
            };

            var content = new FormUrlEncodedContent(values);
            var response = await client.PostAsync("https://www.google.com/recaptcha/api/siteverify", content);
            var result = await response.Content.ReadAsStringAsync();

            dynamic json = JsonConvert.DeserializeObject(result);
            return json.success == true;
        }
        public async static Task UpdateCustomSurcharge(string requestBody, Vendor vendor)
        {
            List<UpdateSurchargeRequest> requests = JsonConvert.DeserializeObject<List<UpdateSurchargeRequest>>(requestBody);
            if (requests == null) throw new Exception("Invalid request");

            foreach (var request in requests)
            {
                var client = await ClientSurcharge.Load(vendor, request?.ClientLookupCode);

                if (request.SurchargeAmount == vendor.InsureTechFeePercentage && request.InvoiceNumber <= 0)
                {
                    await client.Delete(vendor);

                    continue;
                }

                if (request?.InvoiceNumber > 0)
                {
                    var invoice = await InvoiceSurcharge.Load(vendor, request.InvoiceNumber);

                    if (client.CustomSurcharge == request.SurchargeAmount && request.IsEditable == false)
                    {
                        await invoice.Delete(vendor);
                        continue;
                    }

                    await invoice.Save(vendor, request.SurchargeAmount, request.IsEditable);
                }
                else
                {
                    await client.Save(vendor, request.SurchargeAmount);

                }
            }
        }

        public async static Task SaveWireTransaction(string requestBody, Vendor vendor)
        {
            SubmitWireRequest? submitWireRequest = JsonConvert.DeserializeObject<SubmitWireRequest>(requestBody);

            if (!await VerifyCapthca(submitWireRequest.CaptchaToken, submitWireRequest.isDevelopment))
            {
                throw new Exception("Error verifying Captcha");

            }
            if (submitWireRequest == null) throw new Exception("Invalid request");
            await TransactionsService.SaveWireTransaction(submitWireRequest, vendor);// save transaction
            var logger = new GlobalLog();                                                                     // 
            await AppliedEpicReceiptService.SubmitPaymentToEpic(submitWireRequest.AccountId, vendor, logger, vendor.defaultEmail.ToList(), "APPROVED", submitWireRequest.ConfNumber, submitWireRequest.InvoiceNumber, submitWireRequest.Amount ?? 0, 0, "XXXXX", PaymentMethod.Check, DebitCredit.Credit, "Wire Funds");
            SimpleEmail email = new SimpleEmail(new List<string> { submitWireRequest.CsrEmail }, "New Wire Confirmed", $"<html>\r\n                              <head>\r\n                                  <meta charset=\"UTF-8\">\r\n                                  <title>Wire Transfer Confirmation</title>\r\n                                  <style>\r\n                                    body {{\r\n                                      font-family: Arial, sans-serif;\r\n                                      background-color: #f4f4f7;\r\n                                      margin: 0;\r\n                                      padding: 0;\r\n                                      color: #333333;\r\n                                    }}\r\n                                    .container {{\r\n                                      max-width: 600px;\r\n                                      margin: 20px auto;\r\n                                      background-color: #ffffff;\r\n                                      border-radius: 8px;\r\n                                      overflow: hidden;\r\n                                      box-shadow: 0 2px 5px rgba(0,0,0,0.1);\r\n                                      padding: 20px;\r\n                                    }}\r\n                                    .header {{\r\n                                      background-color: #004aad;\r\n                                      color: #ffffff;\r\n                                      padding: 15px;\r\n                                      text-align: center;\r\n                                      font-size: 20px;\r\n                                      font-weight: bold;\r\n                                    }}\r\n                                    .body {{\r\n                                      padding: 20px;\r\n                                      line-height: 1.5;\r\n                                    }}\r\n                                    .body p {{\r\n                                      margin: 10px 0;\r\n                                    }}\r\n                                    .button {{\r\n                                      display: inline-block;\r\n                                      background-color: #28a745;\r\n                                      color: #ffffff !important;\r\n                                      padding: 10px 20px;\r\n                                      text-decoration: none;\r\n                                      border-radius: 5px;\r\n                                      margin-top: 20px;\r\n                                    }}\r\n                                    .footer {{\r\n                                      font-size: 12px;\r\n                                      color: #888888;\r\n                                      text-align: center;\r\n                                      padding: 15px;\r\n                                      border-top: 1px solid #dddddd;\r\n                                    }}\r\n                                  </style>\r\n                                </head>\r\n                              <body>  <div class=\"container\">\r\n    <div class=\"header\">\r\n      Wire Transfer Confirmed\r\n    </div>\r\n    <div class=\"body\">\r\n <p>The customer <strong>{submitWireRequest.CustomerName}</strong>-{submitWireRequest.AccountId} has confirmed that they have sent a wire transfer.</p>\r\n      <p><strong>Amount:</strong> {submitWireRequest.Amount?.ToString("C", CultureInfo.GetCultureInfo("en-US"))}\r\n \r\n    </p>  <p> <strong>Reference:</strong> {submitWireRequest.RefNumber}\r\n   \r\n \r\n </p> <p>     <strong>Bank Conf Number:</strong> {submitWireRequest.ConfNumber}\r\n    </p>\r\n  <p><strong>Customer Notes:</strong></p>\r\n  <div style=\"\r\n        border: 1px solid #cccccc;\r\n        background-color: #f9f9f9;\r\n        padding: 10px;\r\n        border-radius: 5px;\r\n        font-family: Arial, sans-serif;\r\n        font-size: 14px;\r\n        white-space: pre-wrap;\r\n        \">\r\n      {submitWireRequest.Notes}\r\n  </div>\r\n\r\n      <p>Please review and update the account accordingly.</p>\r\n      <a href=\"https://yourinternalportal.example.com\" class=\"button\"> Confirm Payment</a>\r\n    </div>\r\n    <div class=\"footer\">\r\n      This is an automated message. Please do not reply to this email.\r\n    </div>\r\n  </div>  </body>\r\n                            </html>", vendor.defaultEmail);
            
            Cardknox.CardknoxReportItem transaction =  TransactionsService.GetTransactions(vendor.Id, DateTime.Now.AddDays(-1), DateTime.Now.AddDays(1), submitWireRequest.RefNumber, "", new List<string> { "ALL" }, new List<int> { -1 },"Date", 1, 10 ).Result.ReportData.FirstOrDefault();
            email.Attachment = await PdfReceiptGenerator.GenerateReceipt(transaction, submitWireRequest.RefNumber, submitWireRequest.Notes, vendor);
            await email.Send();

        }

        public async static Task<CardknoxResponse> MakeCheckPaymentToCardknox(string requestBody, Vendor vendor, Boolean userVerified = false)
        {
            ReceiveACHPaymentRequest? request = JsonConvert.DeserializeObject<ReceiveACHPaymentRequest>(requestBody);
            if (request == null) throw new Exception("Invalid request");

            //if (!await VerifyCapthca(request.CaptchaToken, request.isDevelopment)  &&  !userVerified)
            //{
            //    return new CardknoxResponse() { xError = "Error verifying Captcha" };

            //}

            CardknoxCheckTransactionApiRequest apiRequest = new CardknoxCheckTransactionApiRequest();
            apiRequest.xAmount = request?.Amount ?? 0;
            apiRequest.xBillLastName = request?.AccountID ?? "";
            apiRequest.xRouting = request?.RoutingNumber;
            apiRequest.xAccount = request?.AccountNumber;
            apiRequest.xName = request?.AccountName;
            apiRequest.xCustom02 = request?.CSRCode ?? "";
            apiRequest.xCustom03 = request?.CSREmail ?? "";
            apiRequest.xAccountType = request.AccountType ?? "Checking";
            apiRequest.xBillCity = request?.City ?? "";
            apiRequest.xZip = request?.Zip ?? "";
            apiRequest.xBillPhone = request?.Phone ?? "";
            apiRequest.xStreet = request?.BillingAddress ?? "";
            apiRequest.xBillState = request?.State ?? "";
            apiRequest.xName = request?.CardHolderName ?? "";
            apiRequest.xEmail = request?.Email ?? "";
            apiRequest.xToken = request?.Token;
            apiRequest.xInvoice = request?.InvoiceNumber ?? "";
            apiRequest.xSoftwareName = request?.Software ?? "Insure-Tech"; 

            var rsp = await apiRequest.SendRequest(vendor);
            if (request.SavePaymentMethod && rsp.xResult != "E")
            {
                SavedMethods savedMethods = new SavedMethods()
                {
                    CardType = "ACH",
                    CustomerNumber = request.AccountID,
                    MaskedAccountNumber = rsp.xMaskedAccountNumber,
                    Token = rsp.xToken,
                    Exp = rsp.xExp
                };
                var s3 = new AmzS3Bucket(vendor.s3BucketName, "SavedMethods.jsonl");
                await s3.AppendRecordAsync(savedMethods);
            }
            return rsp;
        }

        public async static Task<List<SavedMethods>> SaveDefaultPaymentMethod(string token, string accountId, Vendor vendor)
        {
            var s3 = new AmzS3Bucket(vendor.s3BucketName, "SavedMethods.jsonl");
            var methods = await s3.QueryJsonLinesAsync<SavedMethods>("1=1");


            // 2. Filter by account ID
            var accountMethods = methods.Where(m => m.CustomerNumber == accountId).ToList();

            // 3. If only one exists → mark it as default and return
            if (accountMethods.Count == 1)
            {
                accountMethods[0].isDefault = true;
            }
            else
            {
                // Set all to false first
                foreach (var m in accountMethods)
                    m.isDefault = false;

                // 4. Find the method with the given token → set it as default
                var methodToSetDefault = accountMethods.FirstOrDefault(m => m.Token == token);
                if (methodToSetDefault != null)
                {
                    methodToSetDefault.isDefault = true;
                }
            }


            await s3.SaveAsJsonLinesAsync(methods);

            // 6. Return updated list for that account
            return methods.Where(m => m.CustomerNumber == accountId).ToList();
        }

        public async static Task DeletePaymentMethod(string token, Vendor vendor)
        {
            var s3 = new AmzS3Bucket(vendor.s3BucketName, "SavedMethods.jsonl");
            var methods = await s3.QueryJsonLinesAsync<SavedMethods>("1=1");

            var filteredMethods = methods.Where(x => x.Token != token).ToList();


            await s3.SaveAsJsonLinesAsync(filteredMethods);

        }

        public async static Task<HttpResponseMessage> MakeDigitalWalletPaymentToCardknox(string requestBody, Vendor vendor)
        {
            ReceiveDigitalPaymentRequest? request = JsonConvert.DeserializeObject<ReceiveDigitalPaymentRequest>(requestBody);
            CardknoxDigitalWalletTransactionApiRequest apiRequest = new CardknoxDigitalWalletTransactionApiRequest();

            byte[] bytes = Encoding.UTF8.GetBytes(request.CardNumber);
            var encodedCardNumber = Convert.ToBase64String(bytes);
            apiRequest.xCardNum = encodedCardNumber;
            apiRequest.xAmount = request?.Amount ?? 0;
            apiRequest.xBillCity = request.City ?? "";
            apiRequest.xBillZip = request.Zip ?? "";
            apiRequest.xBillStreet = request.Street ?? "";
            apiRequest.xBillState = request.State ?? "";
            apiRequest.xBillFirstName = request.FirstName ?? "";
            apiRequest.xBillLastName = request?.AccountID ?? "";
            apiRequest.xSoftwareName = request?.Software ?? "Insure-Tech";
            return await apiRequest.PostToCardknox(vendor);


        }
        public async static Task<CardknoxResponse> MakePaymentToCardknox(string requestBody, Vendor vendor)
        {

            ReceiveCCPaymentRequest? request = JsonConvert.DeserializeObject<ReceiveCCPaymentRequest>(requestBody);
            CardknoxCCTransactionApiRequest apiRequest = new CardknoxCCTransactionApiRequest();
            if (request.isAuthOnly) apiRequest.xCommand = "cc:authonly";
            
            apiRequest.xAmount = (request?.Surcharge ?? 0) + (request?.Subtotal ?? 0);
            apiRequest.xCustom09 = request?.Surcharge ?? 0;
            apiRequest.xCustom10 = request?.Subtotal ?? 0;
            apiRequest.xBillLastName = request?.AccountID ?? "";
            apiRequest.xCardNum = request?.CardNumber;
            apiRequest.xExp = request?.ExpDate;
            apiRequest.xCvv = request?.CVV;
            apiRequest.xCustom02 = request?.CSRCode ?? "";
            apiRequest.xCustom03 = request?.CSREmail ?? "";
            apiRequest.xBillCity = request?.City ?? "";
            apiRequest.xZip = request?.Zip ?? "";
            apiRequest.xBillPhone = request?.Phone ?? "";
            apiRequest.xStreet = request?.BillingAddress ?? "";
            apiRequest.xBillState = request?.State ?? "";
            apiRequest.xName = request?.CardHolderName ?? "";
            apiRequest.xEmail = request?.Email ?? "";
            apiRequest.xToken = request?.Token;
            apiRequest.xSoftwareName = request?.Software ?? "Insure-Tech"; 
            apiRequest.xInvoice = request?.InvoiceNumber?? "";


            if (vendor.IsInstructional)
            {
                apiRequest.xSplitInstruction = GetSplitInstructions(request?.Subtotal ?? 0, vendor, apiRequest.xAmount);
            }
            var rsp = await apiRequest.SendRequest(vendor);
            if (request.SavePaymentMethod && rsp.xResult != "E")
            {
                SavedMethods savedMethods = new SavedMethods()
                {
                    CardType = rsp.xCardType,
                    CustomerNumber = request.AccountID,
                    MaskedAccountNumber = rsp.xMaskedCardNumber,
                    Token = rsp.xToken,
                    Exp = rsp.xExp

                };
                var s3 = new AmzS3Bucket(vendor.s3BucketName, "SavedMethods.jsonl");
                await s3.AppendRecordAsync(savedMethods);
                if (request.IsDefault)
                {
                    await SaveDefaultPaymentMethod(rsp.xToken, request.AccountID, vendor);
                }
            }
            return rsp;

        }
        public async static Task<HttpResponseMessage> VoidTransaction(string requestBody, Vendor vendor)
        {
            ReceiveVoidRequest? request = JsonConvert.DeserializeObject<ReceiveVoidRequest>(requestBody);
            CardknoxVoidCCApiRequest apiRequest = new CardknoxVoidCCApiRequest();
            apiRequest.xRefNum = request.OriginalTransaction;
            if (request.IsCheck) apiRequest.xCommand = "check:void";
            return await apiRequest.PostToCardknox(vendor);
        }
        public static List<SplitInstructions> GetSplitInstructions(decimal subtotal, Vendor vendor, decimal total)
        {


            var cardknoxAmt = (total) * vendor.CardknoxFeePercentage;

            cardknoxAmt = Math.Round(cardknoxAmt, 2, MidpointRounding.ToEven);


            var customerDefaultFee = Math.Round((subtotal) * vendor.InsureTechFeePercentage,2);
            var insureTechAmt = Math.Max(customerDefaultFee, 0);
            var vendorAmt = total - insureTechAmt;
            return new List<SplitInstructions>()
                {

                    new SplitInstructions()
                        {
                            xAmount = insureTechAmt,
                            xMid = "70486"
                        },
                    new SplitInstructions() {
                        xAmount=vendorAmt,
                        xMid=vendor.CardknoxMerchantId.ToString()
                    }
                };



        }
        public async static Task<HttpResponseMessage> IssueRefund(string requestBody, Vendor vendor)
        {

            ReceiveRefundRequest? request = JsonConvert.DeserializeObject<ReceiveRefundRequest>(requestBody);
            CardknoxCCRefundApiRequest apiRequest = new();
            if (request.IsCheck) apiRequest.xCommand = "check:Refund";
            apiRequest.xRefNum = request?.OriginalTransaction ?? "";
            apiRequest.xAmount = request.IsCheck? request.Amount : (request?.Surcharge ?? 0) + (request?.Subtotal ?? 0);
            apiRequest.xCustom09 = request?.Surcharge ?? 0;
            apiRequest.xCustom10 = request?.Subtotal ?? 0;
            apiRequest.xBillLastName = request?.AccountID ?? "";
            apiRequest.xCustom02 = request?.CSRCode ?? "";
            apiRequest.xCustom03 = request?.CSREmail ?? "";
            apiRequest.xBillCity = request?.City ?? "";
            apiRequest.xZip = request?.Zip ?? "";
            apiRequest.xBillPhone = request?.Phone ?? "";
            apiRequest.xStreet = request?.BillingAddress ?? "";
            apiRequest.xBillState = request?.State ?? "";
            apiRequest.xName = request?.CardHolderName ?? "";
            apiRequest.xEmail = request?.Email ?? "";

            if (vendor.IsInstructional && !request.IsCheck)
            {
                apiRequest.xSplitInstruction = GetSplitInstructions(request?.Subtotal ?? 0, vendor, apiRequest.xAmount);
            }
            return await apiRequest.PostToCardknox(vendor);

        }

        public static async Task ConfirmWirePayment(ConfirmWireRequest confirmWireRequest, Vendor? vendor)
        {
            var transaction = await DynamoDatabaseTransactions.GetItemByIdAsync(vendor.Id.ToString(), confirmWireRequest.RefNum, "Transaction");
            transaction.TryGetValue("Status", out var Status);
            Status.S = "Confirmed";
            await DynamoDatabaseTransactions.UpdateItemAsync(vendor.Id.ToString(), transaction, confirmWireRequest.RefNum, "Transaction");
        }

        public static async Task RefundWire(RefundWireRequest refundWireRequest, Vendor vendor)
        {
            // to be implemented
            var transaction = await DynamoDatabaseTransactions.GetItemByIdAsync(vendor.Id.ToString(), refundWireRequest.RefNum, "Transaction");
            transaction.TryGetValue("Status", out var Status);
            Status.S = "Confirmed";
            transaction.TryGetValue("Amount", out var Amount);
            Amount.N = (refundWireRequest.Amount * -1).ToString();

            transaction.TryGetValue("RefNumber", out var RefNum);
            string refNumNew = await WireRefNumGenerator.GenerateRefNumberAsync();
            RefNum.S = refNumNew;

            transaction.TryGetValue("Command", out var Command);
            Command.S = "Refund Wire";

            DateTime datetime = DateTime.UtcNow;



            // 3. Format as ISO 8601 (sortable)
            string sortableDate = datetime.ToString("yyyy-MM-ddTHH:mm:ssZ");

            transaction.TryGetValue("Date", out var date);
            transaction.TryGetValue("TransactionDate", out var transDate);

            date.S = sortableDate;
            transDate.S = sortableDate;


            transaction.TryGetValue("AccountID", out var acctid);

            transaction.Remove("PK");
            transaction.Remove("SK");

            await DynamoDatabaseTransactions.InsertItemAsync(vendor.Id.ToString(), transaction, transaction["RefNumber"].S, "Transaction");

            await AppliedEpicReceiptService.SubmitPaymentToEpic(acctid.S, vendor, new GlobalLog(), new List<string>(), "APPROVED", refNumNew, "", refundWireRequest.Amount, 0, "XXXXX", PaymentMethod.Check, DebitCredit.Debit, "Submit Wire");
        }

        public static async Task VoidWire(Vendor vendor, VoidWireRequest voidWireRequest)
        {
            var transaction = await DynamoDatabaseTransactions.GetItemByIdAsync(vendor.Id.ToString(), voidWireRequest.RefNum, "Transaction");
            transaction.TryGetValue("Amount", out var Amount);
            var originalAmount = Amount.N;
            Amount.N = "0";

            transaction.TryGetValue("Void", out var voidtrans);
            if (voidtrans != null)
            {
                voidtrans.S = "1";
            }
            else
            {
                transaction.Add("Void", new Amazon.DynamoDBv2.Model.AttributeValue { S = "1" });
            }
            transaction.TryGetValue("RequestAmount", out var originalAmountAtt);
            if (originalAmountAtt != null)
            {
                originalAmountAtt.N = originalAmount;
            }
            else
            {
                transaction.Add("RequestAmount", new Amazon.DynamoDBv2.Model.AttributeValue { S = originalAmount });
            }
            transaction.TryGetValue("AccountID", out var acctid);
            await DynamoDatabaseTransactions.UpdateItemAsync(vendor.Id.ToString(), transaction, voidWireRequest.RefNum, "Transaction");
            await AppliedEpicReceiptService.SubmitPaymentToEpic(acctid?.S ?? "", vendor, new GlobalLog(), new List<string>(), "APPROVED", voidWireRequest.RefNum, "", Convert.ToDecimal(originalAmount), 0, "XXXXXX", PaymentMethod.Check, DebitCredit.Credit, "Void Wire");
        }
    }
}
