using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using AmazonUtilities;
using InsTechClassesV2.Services;
using Newtonsoft.Json;
using InsTechClassesV2.AppliedEpic;
using System.Reflection.PortableExecutable;
using Amazon.SecretsManager.Model.Internal.MarshallTransformations;
using  InsTechClassesV2;
using AmazonUtilities.DynamoDatabase;
using InsTechClassesV2.Cardknox;
using InsTechClassesV2.TransactionRequests;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace InsTechReceivePayment;

public class Function
{
    
    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="input">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns
    public async Task<System.Object> FunctionHandler(APIGatewayHttpApiV2ProxyRequest request, ILambdaContext context)
    {
        try
        {
            Vendor? vendor = null;

            var caseInsensitiveHeaders = new Dictionary<string, string>(request.Headers, StringComparer.OrdinalIgnoreCase);

            
            string fullPath = request.RawPath ?? "";

            string[] segments = fullPath.Split('/', StringSplitOptions.RemoveEmptyEntries);

            string lastSegment = "";
            string secondToLastSegment = "";

            if (segments.Length >= 2)
            {
                secondToLastSegment = segments[^2]; // second to last
                lastSegment = segments[^1];         // last
            }
            else if (segments.Length == 1)
            {
                secondToLastSegment = segments[0];
                lastSegment = "";
            }
            APIGatewayHttpApiV2ProxyResponse response = new APIGatewayHttpApiV2ProxyResponse
            {
                StatusCode = 200,
                Headers = new Dictionary<string, string>
                    {
                        { "Access-Control-Allow-Origin", "*" },
                        { "Access-Control-Allow-Headers", "Content-Type" },
                        { "Access-Control-Allow-Methods", "POST, OPTIONS, GET" }
                    }
            };
            if (lastSegment == "get-subdomain")
            {

                string subdomain = request.QueryStringParameters?["subdomain"] ?? "";
                string clientLookup = request.QueryStringParameters?["accountid"] ?? "";
                string body = await AppliedEpicDataService.GetSubdomain(subdomain, clientLookup);
                response.Body = body;
                return response;
            }

            vendor = await Utilities.GetVendor(secondToLastSegment);
         


            if (vendor == null)
            {
                var email = new SimpleEmail(new List<string>() { "instech101@gmail.com" }, "No vendor Found", $" Error retrieving vendor. {Environment.NewLine} Input object: {JsonConvert.SerializeObject(request)}", new List<string>() { "instech101@gmail.com" });
                await email.Send();
                return "ERROR: No vendor found";
            }


            Console.WriteLine($"Last segment: {lastSegment}");
      

            if (lastSegment == "get-vendor")
            {

                response.Body = JsonConvert.SerializeObject(vendor.PaymentSiteSettings);
                return response;
                    

            }
            else if (lastSegment == "get-surcharge")
            {
                var surcharge = await MakePaymentService.GetClientSurcharge(request.Body, vendor);
                var responseBody = new { surcharge = surcharge, vendorSurcharge = vendor.InsureTechFeePercentage };
                response.Body = JsonConvert.SerializeObject(responseBody);
                return response;
            }
            else if (lastSegment == "get-open-invoices")
            {
                var openInvoices = await AppliedEpicDataService.GetInvoiceList(vendor, request.Body);

                response.Body = JsonConvert.SerializeObject(openInvoices);
                return response;
            }

            else if (lastSegment == "get-surcharge")
            {
                var surcharge = await MakePaymentService.GetClientSurcharge(request.Body, vendor);
                var responseBody = new { surcharge = surcharge, vendorSurcharge = vendor.InsureTechFeePercentage };
                response.Body = JsonConvert.SerializeObject(responseBody);
                return response;
            }
            else if (lastSegment == "save-surcharge")
            {
                try
                {
                    await MakePaymentService.UpdateCustomSurcharge(request.Body, vendor);
                    response.Body = "Success";
                    return response;
                }
                catch (Exception ex)
                {
                    return new APIGatewayHttpApiV2ProxyResponse
                    {
                        StatusCode = 500,
                        Body = $"Error: {ex.Message}",
                        Headers = new Dictionary<string, string>
                        {
                            { "Access-Control-Allow-Origin", "*" },
                            { "Access-Control-Allow-Headers", "Content-Type" },
                            { "Access-Control-Allow-Methods", "POST, OPTIONS" }
                        }
                    };
                }

            }
            else if (lastSegment == "get-client-from-epic")
            {
                var id = int.Parse(request.QueryStringParameters["ClientID"] ?? "-1");
                var clientResponse = await AppliedGetClientRequest.CreateFromID(id, vendor);
                response.Body = JsonConvert.SerializeObject(clientResponse);
                return response;
            }
          
            
            else if (lastSegment == "make-check-payment-to-cardknox")
            {
                var cardknoxResponse = await MakePaymentService.MakeCheckPaymentToCardknox(request.Body, vendor);
                response.Body = JsonConvert.SerializeObject(cardknoxResponse);
                return response;
            }

            else if (lastSegment == "make-payment-cardknox")
            {
                var pamntResponse = await MakePaymentService.MakePaymentToCardknox(request.Body, vendor);
                response.Body = JsonConvert.SerializeObject(pamntResponse);

                return response;
            }
            else if (lastSegment == "make-digital-payment")
            {
                var digitalPaymentResponse = await MakePaymentService.MakeDigitalWalletPaymentToCardknox(request.Body, vendor);
                var body = await digitalPaymentResponse.Content.ReadAsStringAsync();
                response.Body = body;   
                return response;
            }
            
            //else if (lastSegment == "void-transaction")
            //{
            //    var paymentResponse = await MakePaymentService.VoidTransaction(request.Body, vendor);
            //    var body = await paymentResponse.Content.ReadAsStringAsync();
            //    response.Body = body;
            //    return response;
            //}

            //else if (lastSegment == "issue-refund-cardknox")
            //{
            //    var refundResponse = await MakePaymentService.IssueRefund(request.Body, vendor);
            //    var body = await refundResponse.Content.ReadAsStringAsync();
            //    response.Body= body;
            //    return response;
            //}
            else if (lastSegment == "get-invoice")
            {

                var body = await AppliedEpicDataService.GetInvoiceFromInvoiceNumberAndLookupCode(vendor, request.Body);
                response.Body = JsonConvert.SerializeObject(body);
                return response;
                   
            
            }
            else if (lastSegment == "submit-wire")
            {
                await MakePaymentService.SaveWireTransaction(request.Body, vendor);
                response.Body = JsonConvert.SerializeObject( new { message="Success" });
                return response;
            }
            else if (lastSegment == "get-ref-num")
            { 
                var refNum = await WireRefNumGenerator.GenerateRefNumberAsync();
                response.Body = JsonConvert.SerializeObject(new{ refNum });
            }
            
           
            return response;
            
        }
        catch (Exception ex)
        {
            return new APIGatewayHttpApiV2ProxyResponse
            {
                StatusCode = 500,
                Body = $"Error: {ex.Message}",
                Headers = new Dictionary<string, string>
                    {
                        { "Access-Control-Allow-Origin", "*" },
                        { "Access-Control-Allow-Headers", "Content-Type" },
                        { "Access-Control-Allow-Methods", "POST, OPTIONS, GET" }
                    }
            };
          
        }
    }
}
