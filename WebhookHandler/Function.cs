using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.Lambda.Serialization.SystemTextJson;
using Amazon.SQS;
using Amazon.SQS.Model;
using AmazonUtilities;
using InsTechClassesV2;
using InsTechClassesV2.AppliedEpic;
using Newtonsoft.Json;
using System.Collections.Specialized;
using System.Net.NetworkInformation;
using System.Text.Json;
using System.Web;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace WebhookHandler
{

    public class Function
    {
        private readonly IAmazonSQS _sqsClient;
        private readonly string _queueUrl;

        public Function()
        {
            _sqsClient = new AmazonSQSClient();
            _queueUrl = Environment.GetEnvironmentVariable("QUEUE_URL");
        }

        public async Task<APIGatewayHttpApiV2ProxyResponse> FunctionHandler(
            APIGatewayHttpApiV2ProxyRequest input,
            ILambdaContext context)
        {
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
                    return new APIGatewayHttpApiV2ProxyResponse
                    {
                        StatusCode = 500,
                        Body = JsonConvert.SerializeObject(new { success = false })
                    };
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
                string? xStatus = queryParams["xStatus"];
                string xCommand = queryParams["xCommand"] ?? "N/A";
                string xRefNum = queryParams["xRefNum"] ?? "N/A";



                string[] creditCommandArray = ["cc:sale", "cc:capture", "cc:splitcapture", "check:sale"];
                string[] debitCommandArray = ["cc:credit", "cc:refund", "cc:voidrefund", "check:void", "check:refund", "check:voidrefund"];

                DebitCredit debitCredit = DebitCredit.Credit;
                if (debitCommandArray.Contains(xCommand.ToLower()))
                {
                    debitCredit = DebitCredit.Debit;
                }
                else if (creditCommandArray.Contains(xCommand.ToLower()))
                {
                    debitCredit = DebitCredit.Credit;
                }
                else if ((xCommand.ToLower() == "check:adjust" && xStatus == "14") || xCommand.ToLower() == "cc:void" || xCommand.ToLower() == "cc:voidrelease")
                {
                    debitCredit = DebitCredit.Debit;
                }
                else
                {
                    //Console.Write($"Command {xCommand} is not a valid command. No payment was applied to Applied Epic.");
                    //return new APIGatewayHttpApiV2ProxyResponse
                    //{
                    //    StatusCode = 200,
                    //    Body = JsonConvert.SerializeObject(queryParams).ToUpper()
                    //};

                }

                string batch = "";
                try
                {
                    batch = await AppliedEpicReceiptService.GetBatchName(xRefNum, vendor, debitCredit, xCommand.ToLower());
                }
                catch
                {

                }
                if (string.IsNullOrEmpty(batch))
                {
                    batch = $"BATCH_{Guid.NewGuid():N}";
                }
                string? currentRefNum = queryParams["xRefnumCurrent"];
                if (string.IsNullOrEmpty(currentRefNum))
                {
                    currentRefNum = xRefNum;
                }


                await _sqsClient.SendMessageAsync(new SendMessageRequest
                {
                    QueueUrl = _queueUrl,
                    MessageBody = JsonConvert.SerializeObject(input),
                    MessageGroupId =  batch.Replace(" ", "_"),
                    MessageDeduplicationId = currentRefNum
                });

                return new APIGatewayHttpApiV2ProxyResponse
                {
                    StatusCode = 200,
                    Body = JsonConvert.SerializeObject(new { success = true })
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());
                Console.WriteLine(ex.StackTrace);
                var errorEmail = new SimpleEmail(new List<string>() { "rbarenholtz@instechpay.com" }, "Error in webhook", $"Input object: {JsonConvert.SerializeObject(input)}", new List<string>() { "instech101@gmail.com" });
                await errorEmail.Send();

                return new APIGatewayHttpApiV2ProxyResponse
                {
                    StatusCode = 500,
                    Body = JsonConvert.SerializeObject(new { success = false })
                };

            }
        }
    }
}