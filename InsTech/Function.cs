using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using static System.Text.Json.JsonSerializer;
using System.Text.Json.Nodes;
using Newtonsoft.Json;
using System.Collections.Specialized;
using System.Web;
using AmazonUtilities;
using InsTechClassesV2.AppliedEpic;
using InsTechClassesV2;
using static InsTechClassesV2.AppliedEpic.AppliedEpicReceipt;
using System.Diagnostics.Eventing.Reader;
using InsTechClassesV2.Cardknox;
using System.Security.Cryptography;
using static System.Runtime.InteropServices.JavaScript.JSType;
using Amazon.Lambda.SQSEvents;
using Amazon.Runtime.Internal;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace InsTech;

public class Function
{

    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="input">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    /// 
    public async Task SQSHandler(SQSEvent sqsEvent, ILambdaContext context)
    {
        foreach (var record in sqsEvent.Records)
        {
            var originalRequest = System.Text.Json.JsonSerializer.Deserialize<APIGatewayHttpApiV2ProxyRequest>(record.Body);
            await FunctionHandler(originalRequest, context);
        }
    }

    public async Task<string> FunctionHandler(APIGatewayHttpApiV2ProxyRequest input, ILambdaContext context)
    {
        Console.Write(Serialize(input));
        Vendor? vendor = null;
        try
        {



            var caseInsensitiveHeaders = new Dictionary<string, string>(input.Headers, StringComparer.OrdinalIgnoreCase);

            string fullPath = input.RawPath ?? "";
            string[] segments = fullPath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            string? lastSegment = segments.LastOrDefault();

           
            vendor = await Utilities.GetVendor(lastSegment ?? "");
           
            if (vendor == null)
            {
                var errorEmail = new SimpleEmail(new List<string>() { "rbarenholtz@instechpay.com" }, "No vendor Found", $" Error retrieving vendor. {Environment.NewLine} Input object: {JsonConvert.SerializeObject(input)}", new List<string>() { "instech101@gmail.com" });
                await errorEmail.Send();
                return "ERROR: No vendor found";
            }




            string body = input.Body;
            if (input.IsBase64Encoded)
            {
                byte[] decodedBytes = Convert.FromBase64String(input.Body);
                body = System.Text.Encoding.UTF8.GetString(decodedBytes);
                context.Logger.LogLine($"Decoded Body: {body}");
            }
            else
            {
                context.Logger.LogLine($"Raw Body: {body}");
            }
            NameValueCollection queryParams = HttpUtility.ParseQueryString(body);

            // Retrieve values with fallback for missing ones
            string? xAmountStr = queryParams["xAmount"];
            decimal xAmount = decimal.TryParse(xAmountStr, out decimal parsedAmount) ? parsedAmount : 0m;
            string xCommand = queryParams["xCommand"] ?? "N/A";


            PaymentMethod paymentMethod = xCommand.ToLower().Contains("check") ? PaymentMethod.Check : PaymentMethod.CreditCard;
            decimal fundedAmount = xAmount; 

            if (paymentMethod == PaymentMethod.CreditCard)
            {
                fundedAmount = Math.Round(xAmount - (xAmount * vendor.CardknoxFeePercentage), 2);
            }
           
            string? xSubtotalStr = queryParams["xCustom10"];
            decimal xSubtotal = decimal.TryParse(xSubtotalStr, out decimal parsedSubtotal) ? parsedSubtotal : 0m;

            if (paymentMethod == PaymentMethod.Check)
            {
                xSubtotal = xAmount; 
            }

            string xBillLastName = queryParams["xBillLastName"] ?? "";
            string xEmail = queryParams["xCustom03"] ?? "N/A";
            string xCSRLookupCode = queryParams["xCustom02"] ?? "";
            string xEnteredDate = queryParams["xEnteredDate"] ?? "N/A";
            string xMaskedCardNumber = queryParams["xMaskedCardNumber"] ?? "N/A";
            string xName = queryParams["xName"] ?? "N/A";
            string xRefNum = queryParams["xRefNum"] ?? "N/A";
            string xRequestAmount = queryParams["xRequestAmount"] ?? "N/A";
            string xResponseResult = queryParams["xResponseResult"] ?? "N/A";
            string xStatus = queryParams["xStatus"] ?? "N/A";
            string xToken = queryParams["xToken"] ?? "N/A";
            string xInvoiceStr = queryParams["xInvoice"] ?? "N/A";

            int xInvoice = int.TryParse(xInvoiceStr, out int parsedInvoice) ? parsedInvoice : 0;

            List<string> emailList = new List<string>() { xEmail };
            try
            {
               await  TransactionsService.SaveTransaction(xRefNum, vendor); 
            }
            catch (Exception ex)
            {
                context.Logger.LogLine($"Error entering data into internal Database : {ex.Message}");
                var errorEmail = new SimpleEmail(new List<string>() { "rbarenholtz@instechpay.com" }, "Dynamo DB error", $"Error entering data into internal Database {ex.ToString()}", new List<string>() { "instech101@gmail.com" });
                await errorEmail.Send();
            }

            var logger = new GlobalLog();
            Console.Write($"We received a payment in Cardknox account {vendor.CardknoxAccountCode} for account {xMaskedCardNumber}");
            logger.CardknoxAccount = vendor.CardknoxAccountCode;
            logger.AccountNumber = xMaskedCardNumber;
            context.Logger.Log($"Webhook invocation. Body: {body}");

            Console.Write($"CSR Lookup Code: {xCSRLookupCode}");
            Console.Write($"CSR Email Address: {xEmail}");

            string[] creditCommandArray = ["cc:sale", "cc:capture", "cc:splitcapture", "check:sale"];
            string[] debitCommandArray  = ["cc:credit", "cc:refund", "cc:voidrefund", "check:void", "check:refund", "check:voidrefund"];

            DebitCredit debitCredit = DebitCredit.Credit;
            if(debitCommandArray.Contains(xCommand.ToLower()))
            {
                debitCredit = DebitCredit.Debit;
            }
            else if(creditCommandArray.Contains(xCommand.ToLower()))
            { 
                debitCredit = DebitCredit.Credit;
            }
            else if ((xCommand.ToLower() == "check:adjust" && xStatus == "14")|| xCommand.ToLower() == "cc:void" || xCommand.ToLower() ==  "cc:voidrelease")
            {
                string key = await SecretManager.GetSecret(vendor.CardknoxApiKeySecretName);
                var cardknox = await new CardknoxTransactionReportApiRequest(xRefNum, key).GetCardknoxTransactionReportResponse(vendor);
                var transaction = cardknox.ReportData[0];
                xBillLastName = transaction.BillLastName;
                xAmount = (decimal.TryParse(transaction.Custom10, out decimal custom10dec)? custom10dec: 0 ) != 0 ?  custom10dec: transaction.Amount;
                fundedAmount = xAmount;
                debitCredit = DebitCredit.Debit;
                xResponseResult = "APPROVED";
            }
            else
            {
                Console.Write($"Command {xCommand} is not a valid command. No payment was applied to Applied Epic.");
                return Serialize(queryParams).ToUpper();
            }


            var result = await AppliedEpicReceiptService.SubmitPaymentToEpic(xBillLastName, vendor, logger, emailList, xResponseResult, xRefNum, xInvoiceStr,Math.Abs( xSubtotal > 0 ? xSubtotal : xAmount), Math.Abs(xSubtotal > 0 ? xSubtotal : xAmount) - Math.Abs(fundedAmount), xMaskedCardNumber,paymentMethod , debitCredit, xCommand.ToLower());
            context.Logger.LogLine(result);
            if (result.StartsWith("Needs Retry"))
            {
                Console.Write($"Unable to apply payment to receipt with description {result.Replace("Needs Retry", "")} because another user has it opened in Applied. Insure Tech system will retry in 5 minutes");
                await AmazonUtilities.EventScheduler.ScheduleRetry(input);
            }
            if (result == "Transaction not approved. No payment applied.")
            {
                return Serialize(queryParams).ToUpper();
            }
            SimpleEmail email = new SimpleEmail(emailList, "New Payment Recieved", logger.GetLog(), vendor.defaultEmail);
            await email.SendFromTemplate("transaction_email.html", logger);



            return Serialize(queryParams).ToUpper();
        }
        catch (Exception ex)
        {
            var errorEmail = new SimpleEmail(new List<string>() { "rbarenholtz@instechpay.com" }, "Error in Cardknox webhook", $" Error in Cardknox webhook. {Environment.NewLine} Input object: {JsonConvert.SerializeObject(input)}{Environment.NewLine} Exception: {ex.Message}{Environment.NewLine} Stack Trace: {ex.StackTrace}", new List<string>() { "rbarenholtz@instechpay.com" });
            await errorEmail.Send();
            return "ERROR: " + ex.Message;
        }
    }


}
