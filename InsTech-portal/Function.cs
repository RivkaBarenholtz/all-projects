using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.Runtime.Internal;

using AmazonUtilities;
using AmazonUtilities.DynamoDatabase;
using InsTechClassesV2;
using InsTechClassesV2.AppliedEpic;
using InsTechClassesV2.ESign;
using InsTechClassesV2.Cardknox;
using InsTechClassesV2.Services;
using InsTechClassesV2.TransactionRequests;
using InsTechPortal;
using InsTechReceivePayment;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.ComponentModel.Design;
using System.Globalization;
using System.Net.Http;
using System.Numerics;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace InsTech_portal;

public class Function
{

    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="input">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>

    public async Task<APIGatewayHttpApiV2ProxyResponse> FunctionHandler(APIGatewayHttpApiV2ProxyRequest request, ILambdaContext context)
    {
        try
        {

            // Arrange
            //var apolicy = new Policy
            //{
            //    PolicyCode = "P123",
            //    Amount = 1000,
            //    Customer = new CardknoxNewCustomerApiRequest
            //    {
            //        BillFirstName = "John",
            //        Email = "rivkyswia@gmail.com"
            //    }
            //};


            APIGatewayHttpApiV2ProxyResponse response = new APIGatewayHttpApiV2ProxyResponse
            {
                Headers = new Dictionary<string, string>
                {
                    { "Access-Control-Allow-Origin", "*" },
                    {"Access-Control-Allow-Headers", "Authorization, Content-Type, User, Vendor"},
                    {"Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"},
                    { "Content-Type", "application/json" }

                },
                StatusCode = 200
            };

            if (string.Equals( request?.RequestContext?.Http?.Method, "OPTIONS", StringComparison.OrdinalIgnoreCase))
            {
                response.Body = "Success";
                return response;
            }
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
            if (string.IsNullOrEmpty(lastSegment))
            {
                var a = request.Headers.TryGetValue("host", out string? fullDomain);

                var query = (request.QueryStringParameters ?? new Dictionary<string, string>())
                .Select(kv => $"{kv.Key}={kv.Value}")
                .ToList();

                var url = $"https://{fullDomain}/make-payment?{string.Join("&", query)}";
                if (fullDomain.StartsWith("portal"))
                {
                    url = $"https://{fullDomain}/app";
                }
                return new APIGatewayHttpApiV2ProxyResponse
                {
                    StatusCode = 302,
                    Headers = new Dictionary<string, string>
                    {
                        { "Location", url }
                    }
                };
            }

            List<Cognito> user = new();
            Console.WriteLine(JsonConvert.SerializeObject(request));

            if (lastSegment == "get-login-from-code")
            {
                SSOLogin ssoLogin = JsonConvert.DeserializeObject<SSOLogin>(request.Body);
                await ssoLogin.GetFromDynamo();
                response.Body = JsonConvert.SerializeObject(ssoLogin);
                return response;

            }


            if (!caseInsensitiveHeaders.TryGetValue("authorization", out var authHeader) || !authHeader.StartsWith("Bearer "))
            {
                Console.WriteLine("No proper authorization header. ");

                response.StatusCode = 401;
                response.Body = JsonConvert.SerializeObject(new { message = "Missing or invalid Authorization header" });
                return response;
            }
               
            var tokenOnly = authHeader.Substring("Bearer ".Length);
            var isValidToken = await Login.IsTokenValid(tokenOnly);
            if (!isValidToken)
            {
                Console.WriteLine("Token invalid");
                response.StatusCode = 401;
                response.Body = JsonConvert.SerializeObject(new { message = "Invalid or expired token" });
                return response;
            }
            var username = Login.GetEmailFromJwt(tokenOnly);
            user = await User.GetUserAsync(username)??new List<Cognito>();

            if (lastSegment == "get-available-vendors")
            {
                var availableVendorIds = user.Select(x => x.VendorId);
                var vendors = await Utilities.GetVendorListAsync();
                vendors = vendors?.Where(v=> availableVendorIds.Contains(v.Id) ).ToList();
                var returnedVendors = vendors.Select(a => new { a.CardknoxAccountCode, a.Id });
                response.Body = JsonConvert.SerializeObject(returnedVendors);
                return response;
            }
            else if (lastSegment == "get-user-info")
            {
                //select user from dynamo db and return user object 
                response.Body = JsonConvert.SerializeObject(user);
                return response;
            }
            Vendor vendor = null;
             if (request.Headers != null && caseInsensitiveHeaders.TryGetValue("vendor", out string? vid) && int.TryParse(vid, out int value))
            {
                vendor = await Utilities.GetVendorByID(value);
            }
            else
            {
                if (secondToLastSegment != "")
                {
                    vendor = await Utilities.GetVendor(secondToLastSegment);

                }
                else
                { throw new Exception("Missing host header"); }
            }
            if (user.FirstOrDefault(u => u.VendorId == vendor?.Id && !u.Disabled) == null)
            {
                response.StatusCode = 401;
                response.Body = JsonConvert.SerializeObject(new { message = "Forbidden: You do not have access to this vendor." });
                return response;
            }

            if (vendor == null)
            {
                var errorEmail = new SimpleEmail(new List<string>() { "rbarenholtz@instechpay.com" }, "No vendor Found", $" Error retrieving vendor. {Environment.NewLine} Input object: {JsonConvert.SerializeObject(request)}", new List<string>() { "instech101@gmail.com" });
                await errorEmail.Send();
            }

            

            if (lastSegment == "transaction-report")
            {
                var reportRequest = Newtonsoft.Json.JsonConvert.DeserializeObject<CardknoxReportRequest>(request.Body);
                var transactionList = await TransactionsService.GetTransactions(vendor.Id, reportRequest.FromDate, reportRequest.ToDate, reportRequest.RefNum, reportRequest.AccountID, reportRequest.PaymentMethods, reportRequest.Statuses, reportRequest.SortBy, reportRequest.PageNumber, reportRequest.TransactionsPerPage, reportRequest.IsAsc);
                response.Body = JsonConvert.SerializeObject(transactionList);

                return response;
            }
            else if (lastSegment == "get-policy-list")
            {
                //will become too slow hopefully by that time a new employee will deal with this
                var result= await Policy.GetListOfPoliciesFromDb(vendor.Id.ToString());
                response.Body = JsonConvert.SerializeObject(result);
                return response;
            }
            else if (lastSegment == "create-policy")
            {
                var policy = JsonConvert.DeserializeObject<Policy>(request.Body);
                if(string.IsNullOrEmpty(policy.Customer.CustomerId))
                {
                    var customer = policy.Customer;
                    //save in cardknox 
                    var cardknoxCustomer = new CardknoxNewCustomerApiRequest
                    {
                        BillCity = customer.BillCity,
                        BillCountry = customer.BillCountry,
                        BillCompany = customer.BillCompany,
                        BillFirstName = customer.BillFirstName,
                        BillLastName = customer.BillLastName,
                        BillMiddleName = customer.BillMiddleName,
                        BillPhone = customer.BillPhone,
                        BillMobile = customer.BillMobile,
                        BillState = customer.BillState,
                        BillStreet = customer.BillStreet,
                        BillZip = customer.BillZip,
                        CustomerId = customer.CustomerId,
                        CustomerNumber = customer.CustomerNumber,
                        Email = customer.Email,

                    };
                    var rsp = await cardknoxCustomer.PostToCardknox(vendor);
                    var rspString = await rsp.Content.ReadAsStringAsync(); 
                    var ckResponse = JsonConvert.DeserializeObject<dynamic>(rspString);
                    policy.Customer.CustomerId = ckResponse["CustomerId"]?.ToString()??"";
                }
                await  policy?.InsertIntoDynamo(vendor);
                string uploadUrl = "";
                if(!String.IsNullOrEmpty(policy.QuoteFileName))
                {
                    var s3 = new AmzS3Bucket("policy-uploads", $"{vendor.CardknoxMerchantId}/{policy.Id}");
                    uploadUrl = await s3.GetUploadUrlAsync();
                }
                    
                response.Body = JsonConvert.SerializeObject(new
                {
                    Message = "Success",
                    PolicyId = policy.Id, 
                    UploadUrl = uploadUrl 

                });

            }
            else if (lastSegment == "get-policy-doc-url")
            {
                var policyid = request.QueryStringParameters["policyid"];
                var s3 = new AmzS3Bucket("policy-uploads", $"{vendor.CardknoxMerchantId}/{policyid}");
                var s3Url =  s3.GetDownloadPreSignedUrl();

                response.Body = JsonConvert.SerializeObject(new
                {
                    Message = "Success",
                    download = s3Url

                });
            }

            else if (lastSegment == "update-policy")
            {
                var policy = JsonConvert.DeserializeObject<Policy>(request.Body);

                //save in dynamo
                await policy.UpdateDynamoAsync(vendor.Id.ToString());
                response.Body = JsonConvert.SerializeObject(new
                {
                    Message = "Success",
                    PolicyId = policy.Id
                });
                return response;
            }
            else if (lastSegment == "get-cardknox-accounts")
            {
                string clientLookup = request.QueryStringParameters?["accountid"] ?? "";
                var body = await AppliedEpicDataService.GetCardknoxAccounts(vendor, clientLookup);
                response.Body = JsonConvert.SerializeObject(body);
                return response;
            }
            else if (lastSegment == "get-vendor")
            {
                vendor.PaymentSiteSettings.subdomain = vendor.subdomain;
                response.Body = JsonConvert.SerializeObject(vendor.PaymentSiteSettings);
                return response;
            }
            else if (lastSegment == "make-check-payment-to-cardknox")
            {
                var cardknoxResponse = await MakePaymentService.MakeCheckPaymentToCardknox(request.Body, vendor, true);
                response.Body = JsonConvert.SerializeObject(cardknoxResponse);
                return response;
            }

            else if (lastSegment == "make-payment-cardknox")
            {
                var pamntResponse = await MakePaymentService.MakePaymentToCardknox(request.Body, vendor);
                response.Body = JsonConvert.SerializeObject(pamntResponse);

                return response;
            }
            else if (lastSegment == "send-invoice-email")
            {
                var emailRequest = JsonConvert.DeserializeObject<EmailInvoiceRequest>(request.Body);

                var email = new SimpleEmail(emailRequest.recipients, emailRequest.Subject, emailRequest.Body, vendor.defaultEmail);

                if (emailRequest.epicAttachments.Count > 0)
                {
                    foreach (var attachmentUrl in emailRequest.epicAttachments)
                    {
                        var attachmentItemRsp = await AppliedApiClient.GetObject(attachmentUrl, new Dictionary<string, string>(), vendor);
                        var attachmentItemJson = await attachmentItemRsp.Content.ReadAsStringAsync();
                        dynamic attachmentItem = JsonConvert.DeserializeObject(attachmentItemJson);
                        if (attachmentItem.file != null)
                        {
                            var fileUrl = (string)attachmentItem.file.url;
                            var fileName = (string)attachmentItem.file.name;
                            var httpClient = new HttpClient();
                            var bytes = await httpClient.GetByteArrayAsync(fileUrl);
                            email.attachmentFiles.Add(new SimpleEmail.AttachmentFile
                            {
                                FileName = fileName,
                                FileContent = bytes
                            });
                        }
                    }
                }

                if (emailRequest?.Attachment?.Count > 0)
                {
                    foreach (var attachment in emailRequest.Attachment)
                    {
                        var base64Data = Regex.Replace(attachment.Data, @"^data:.*?;base64,", "");

                        // 3. Convert Base64 string to Byte Array
                        byte[] fileBytes = Convert.FromBase64String(base64Data);
                        email.attachmentFiles.Add(new SimpleEmail.AttachmentFile
                        {
                            FileName = attachment.Name,
                            FileContent = fileBytes
                        });


                        // Now you can use fileBytes with your Email Service (SES, SendGrid, etc.)
                        context.Logger.LogLine($"Received file: {attachment.Name}, Size: {fileBytes.Length} bytes");
                    }




                }
                await email.Send(false);
                response.Body = JsonConvert.SerializeObject(new { message = "Success" });

            }
            //else if (lastSegment == "save-policy-file")
            //{
            //    var attachment = JsonConvert.DeserializeObject<AttachmentInfo>(request.Body);
            //    var s3 = new AmzS3Bucket(vendor.s3BucketName, $"policies/{attachment.Name}");
            //    string base64 = attachment.Data.Contains(",")
            //    ? attachment.Data.Substring(attachment.Data.IndexOf(",") + 1)
            //     : attachment.Data;
            //    await s3.UploadFileToS3(base64, "application/pdf");

            //}
            else if (lastSegment == "void-transaction")
            {
                var voidResponse = await MakePaymentService.VoidTransaction(request.Body, vendor);
                response.Body = await voidResponse.Content.ReadAsStringAsync();
                return response;
            }


            else if (lastSegment == "issue-refund-cardknox")
            {
                var refundResponse = await MakePaymentService.IssueRefund(request.Body, vendor);
                response.Body = await refundResponse.Content.ReadAsStringAsync();
                return response;
            }
            else if (lastSegment == "list-payment-methods")
            {
                var paymentMethodListRequest = JsonConvert.DeserializeObject<CardknoxListPaymentMethodApiRequest>(request.Body);
                var paymentMethodsResponse = await paymentMethodListRequest.PostToCardknox(vendor);
                response.Body = await paymentMethodsResponse.Content.ReadAsStringAsync();
                return response;
            }
            else if (lastSegment == "list-customers")
            {
                var customerListApiRequest = JsonConvert.DeserializeObject<CardknoxListCustomerApiRequest>(request.Body);
                var customerResponse = await customerListApiRequest.PostToCardknox(vendor);
                response.Body = await customerResponse.Content.ReadAsStringAsync();
                return response;
            }
            else if (lastSegment == "generate-receipt")
            {
                var transaction = JsonConvert.DeserializeObject<CardknoxReportItem>(request.Body);
                var byteArray = await PdfReceiptGenerator.GenerateReceipt(transaction, transaction.RefNum, "", vendor);
                string base64Pdf = Convert.ToBase64String(byteArray);
                response.Body = base64Pdf;
                response.IsBase64Encoded = true;
                return response;
            }
            else if (lastSegment == "email-receipt")
            {
                var req = JsonConvert.DeserializeObject<EmailReceiptRequest>(request.Body);

                SimpleEmail email = new SimpleEmail(req.EmailAddresses, "Payment Receipt", "Please see the attached payment receipt", new List<string>());
                email.Attachment = await PdfReceiptGenerator.GenerateReceipt(req.Transaction, req.Transaction.RefNum, "", vendor);
                await email.Send();
                response.Body = response.Body = JsonConvert.SerializeObject(new { message = "Success" });
            }
            else if (lastSegment == "list-schedules")
            {
                var scheduleListRequest = JsonConvert.DeserializeObject<ListScheduleApiRequest>(request.Body);
                var schedulesResponse = await scheduleListRequest.PostToCardknox(vendor);
                response.Body = await schedulesResponse.Content.ReadAsStringAsync();
                return response;
            }
            else if (lastSegment == "get-schedule")
            {
                var scheduleRequest = JsonConvert.DeserializeObject<GetScheduleApiRequest>(request.Body);
                var schedulesResponse = await scheduleRequest.PostToCardknox(vendor);
                string scheduleResponseStr = await schedulesResponse.Content.ReadAsStringAsync();
                var scheduleResponseObj = JsonConvert.DeserializeObject<GetScheduleApiResponse>(scheduleResponseStr);
                if (scheduleResponseObj != null && string.IsNullOrEmpty(scheduleResponseObj.PaymentMethodId))
                {
                    //get payment method id from s3 
                    List<SchedulePaymentMethod> schedulePayments = new List<SchedulePaymentMethod>();
                    var s3 = new AmzS3Bucket(vendor.s3BucketName, "SchedulePaymentMethods.json");
                    string? schedulePaymentData = await s3.ReadS3File();
                    if (!string.IsNullOrEmpty(schedulePaymentData))
                    {
                        schedulePayments = JsonConvert.DeserializeObject<List<SchedulePaymentMethod>>(schedulePaymentData) ?? new List<SchedulePaymentMethod>();
                        var matchedPayment = schedulePayments.FirstOrDefault(sp => sp.ScheduleId == scheduleRequest.ScheduleId);
                        if (matchedPayment != null)
                        {
                            scheduleResponseObj.PaymentMethodId = matchedPayment.PaymentMethodId;
                        }
                    }
                    if (scheduleResponseObj != null && !string.IsNullOrEmpty(scheduleResponseObj.PaymentMethodId))
                    {
                        var getPaymentMethodRequest = new CardknoxGetPaymentMethodApiRequest()
                        {
                            PaymentMethodId = scheduleResponseObj.PaymentMethodId
                        };
                        var pymntResponse = await getPaymentMethodRequest.PostToCardknox(vendor);
                        var pymntResponseStr = await pymntResponse.Content.ReadAsStringAsync();
                        var pymntResponseObj = JsonConvert.DeserializeObject<PaymentMethodApiResponse>(pymntResponseStr);
                        scheduleResponseObj.PaymentMethod = pymntResponseObj;

                    }

                }
                response.Body = JsonConvert.SerializeObject(scheduleResponseObj);
                return response;
            }
            else if (lastSegment == "get-customervendor-by-name")
            {
                string name = request.QueryStringParameters?["name"] ?? "";
                var cv = await CustomerVendor.GetByNameAsync(name);
                response.Body = JsonConvert.SerializeObject(cv);
                return response;
            }
            else if (lastSegment == "list-customervendors")
            {
                var customerVendors = await CustomerVendor.GetListFromDb(vendor.Id.ToString());
                response.Body = JsonConvert.SerializeObject(customerVendors);
                return response;
            }
            else if (lastSegment == "create-customervendor")
            {
                var cv = JsonConvert.DeserializeObject<CustomerVendor>(request.Body);
                await cv.InsertIntoDynamo(vendor.Id.ToString());
                response.Body = JsonConvert.SerializeObject(new { Message = "Success", Id = cv.Id });
                return response;
            }
            else if (lastSegment == "update-customervendor")
            {
                var cv = JsonConvert.DeserializeObject<CustomerVendor>(request.Body);
                await cv.UpdateDynamoAsync(vendor.Id.ToString());
                response.Body = JsonConvert.SerializeObject(new { Message = "Success" });
                return response;
            }
            else if (lastSegment == "list-payables")
            {
                var payables = await Payable.GetListFromDb(vendor.Id.ToString());
                response.Body = JsonConvert.SerializeObject(payables);
                return response;
            }
            else if (lastSegment == "create-payable")
            {
                var payable = JsonConvert.DeserializeObject<Payable>(request.Body);

                // If no existing vendor was selected, save the on-the-fly vendor as a CustomerVendor first
                if (string.IsNullOrEmpty(payable.CustomerVendorId))
                {
                    var newVendor = new CustomerVendor
                    {
                        Name = payable.VendorName,
                        PaymentAccountNumber = payable.PaymentAccountNumber,
                        PaymentRoutingNumber = payable.PaymentRoutingNumber,
                        Address = payable.VendorAddress,
                        Notes = payable.VendorNotes,
                    };
                    await newVendor.InsertIntoDynamo(vendor.Id.ToString());
                    payable.CustomerVendorId = newVendor.Id;
                }

                // TODO: Call payment gateway here to obtain a ref number before saving
                // Example (wire/ACH gateway call):
                // var gatewayRequest = new { AccountNumber = payable.PaymentAccountNumber, RoutingNumber = payable.PaymentRoutingNumber, Amount = payable.Amount };
                // var gatewayResponse = await SomeGatewayClient.RemitAsync(gatewayRequest);
                // payable.PaymentRefNum = gatewayResponse.RefNum;

                await payable.InsertIntoDynamo(vendor.Id.ToString());

                // If linked to a policy, add this payment to PaidToCarrier
                if (!string.IsNullOrEmpty(payable.PolicyId))
                {
                    var linkedPolicy = await Policy.GetPolicyByIdAsync(vendor.Id.ToString(), payable.PolicyId);
                    if (linkedPolicy != null)
                    {
                        linkedPolicy.PaidToCarrier += payable.Amount;
                        await linkedPolicy.UpdateDynamoAsync(vendor.Id.ToString());
                    }
                }

                response.Body = JsonConvert.SerializeObject(new { Message = "Success", Id = payable.Id, PaymentRefNum = payable.PaymentRefNum });
                return response;
            }
            else if (lastSegment == "create-customer")
            {
                //save all customers to dynamo db here

                var createCustomerRequest = JsonConvert.DeserializeObject<CardknoxNewCustomerApiRequest>(request.Body);
                //
                var createCustomerResponse = await createCustomerRequest.PostToCardknox(vendor);
                response.Body = await createCustomerResponse.Content.ReadAsStringAsync();
                return response;
            }
            else if (lastSegment == "create-new-schedule-cc" || lastSegment == "create-new-schedule-check")
            {

                var createScheduleRequest = JsonConvert.DeserializeObject<CreateScheduleApiRequest>(request.Body);
                if (createScheduleRequest.NewCustomer != null)
                {
                    createScheduleRequest.NewCustomer.SoftwareVersion = null;
                    createScheduleRequest.NewCustomer.SoftwareName = null;
                }
                if (createScheduleRequest.NewPaymentMethod != null)
                {
                    createScheduleRequest.NewPaymentMethod.SoftwareVersion = null;
                    createScheduleRequest.NewPaymentMethod.SoftwareName = null;
                }
                if (createScheduleRequest.NewPaymentMethod != null && string.IsNullOrEmpty(createScheduleRequest.NewPaymentMethod.Token))
                {
                    if (lastSegment == "create-new-schedule-cc")
                    {
                        var ccSaveRequest = JsonConvert.DeserializeObject<CardknoxSaveCCInfoApiRequest>(request.Body);
                        var token = await ccSaveRequest.GetToken(vendor);


                        createScheduleRequest.NewPaymentMethod.Token = token;
                    }
                    else // create-new-schedule-check
                    {
                        var CheckSaveRequest = JsonConvert.DeserializeObject<CardknoxSaveCheckInfoApiRequest>(request.Body);

                        var token = await CheckSaveRequest.GetToken(vendor);


                        createScheduleRequest.NewPaymentMethod.Token = token;
                    }
                }
                if (vendor.IsInstructional && lastSegment == "create-new-schedule-cc")
                {
                    var InsureTechFee = (createScheduleRequest.Subtotal ?? createScheduleRequest.Amount) * vendor.InsureTechFeePercentage;
                    createScheduleRequest.SplitInstruction = new List<SplitInstructions>()
                    {
                        new SplitInstructions()
                        {
                            xAmount = InsureTechFee,
                            xMid = "70486"
                        },
                        new SplitInstructions()
                        {
                            xAmount = createScheduleRequest.Amount - InsureTechFee,
                            xMid = vendor.CardknoxMerchantId.ToString()
                        }

                    };
                }
                createScheduleRequest.Subtotal = null;
                var cardknoxScheduleResponse = await createScheduleRequest.PostToCardknox(vendor);
                // save response to s3 if payment method id is present
                response.Body = await cardknoxScheduleResponse.Content.ReadAsStringAsync();
                var respJson = JsonConvert.DeserializeObject<JObject>(response.Body);
                if (!string.IsNullOrEmpty(respJson["PaymentMethodId"].ToString()) && !string.IsNullOrEmpty(respJson["ScheduleId"].ToString()))
                {
                    var s3 = new AmzS3Bucket(vendor.s3BucketName, "SchedulePaymentMethods.json");
                    string? schedulePaymentData = await s3.ReadS3File();
                    if (!string.IsNullOrEmpty(schedulePaymentData))
                    {
                        var schedulePayments = JsonConvert.DeserializeObject<List<SchedulePaymentMethod>>(schedulePaymentData) ?? new List<SchedulePaymentMethod>();
                        schedulePayments.Add(new SchedulePaymentMethod(respJson["ScheduleId"].ToString(), respJson["PaymentMethodId"].ToString()));
                        await s3.UpdateFileContentAsync(JsonConvert.SerializeObject(schedulePayments));
                    }
                }
                return response;
            }
            else if (lastSegment == "create-payment-method-check" || lastSegment == "create-payment-method-cc")
            {
                CardknoxApiRequest cardknoxApiRequest;
                string tokenType;
                if (lastSegment == "create-payment-method-cc")
                {
                    cardknoxApiRequest = JsonConvert.DeserializeObject<CardknoxSaveCCInfoApiRequest>(request.Body);
                    tokenType = "cc";
                }
                else
                {
                    cardknoxApiRequest = JsonConvert.DeserializeObject<CardknoxSaveCheckInfoApiRequest>(request.Body);
                    tokenType = "check";
                }
                var token = await cardknoxApiRequest.GetToken(vendor);
                var req = JsonConvert.DeserializeObject<NewPaymentMethodApiRequest>(request.Body) ?? new NewPaymentMethodApiRequest();
                req.Token = token;
                req.TokenType = tokenType;

                var rsp = await req.PostToCardknox(vendor);
                response.Body = await rsp.Content.ReadAsStringAsync();
                return response;

            }
            else if (lastSegment == "delete-payment-method")
            {
                var req = JsonConvert.DeserializeObject<CardknoxDeletePaymentMethodApiRequest>(request.Body);
                var rsp = await req.PostToCardknox(vendor);
                response.Body = await rsp.Content.ReadAsStringAsync();
                return response;

            }
            else if (lastSegment == "update-payment-method")
            {
                var req = JsonConvert.DeserializeObject<UpdatePaymentMethodApiRequest>(request.Body);
                var rsp = await req.PostToCardknox(vendor);
                response.Body = await rsp.Content.ReadAsStringAsync();
                return response;
            }
            else if (lastSegment == "get-cardknox-customers")
            {
                CardknoxListCustomerApiRequest apiRequest = new CardknoxListCustomerApiRequest();
                apiRequest.Filters = JsonConvert.DeserializeObject<CustomerFilters>(request.Body) ?? new();
                var cardknoxResponse = await apiRequest.PostToCardknox(vendor);
                response.Body = await cardknoxResponse.Content.ReadAsStringAsync();
                return response;

            }
            else if (lastSegment == "export-transactions-to-csv")
            {
                var csvRequest = JsonConvert.DeserializeObject<CardknoxReportRequest>(request.Body);
                var dynamoResult = await AmazonUtilities.DynamoDatabaseTransactions.QueryTransactionsAsync($"Vendor#{vendor.Id}", csvRequest.FromDate, csvRequest.ToDate, csvRequest.RefNum, csvRequest.AccountID, csvRequest.PaymentMethods, csvRequest.Statuses, csvRequest.PageNumber, csvRequest.TransactionsPerPage, csvRequest.SortBy, csvRequest.IsAsc);
                var csvString = Utilities.ConvertToCsv(dynamoResult.resultSet);
                var csvBytes = Encoding.UTF8.GetBytes(csvString);
                string base64Csv = Convert.ToBase64String(csvBytes);
                response.Body = base64Csv;
                response.IsBase64Encoded = true;
                return response;

            }
            else if (lastSegment == "delete-schedule")
            {
                var req = JsonConvert.DeserializeObject<DeleteScheduleApiRequest>(request.Body);
                var rsp = await req.PostToCardknox(vendor);
                response.Body = await rsp.Content.ReadAsStringAsync();
                return response;
            }
            else if (lastSegment == "enable-schedule")
            {
                var req = JsonConvert.DeserializeObject<EnableScheduleApiRequest>(request.Body);
                var rsp = await req.PostToCardknox(vendor);
                response.Body = await rsp.Content.ReadAsStringAsync();
                return response;
            }
            else if (lastSegment == "disable-schedule")
            {
                var req = JsonConvert.DeserializeObject<StopScheduleApiRequest>(request.Body);
                var rsp = await req.PostToCardknox(vendor);
                response.Body = await rsp.Content.ReadAsStringAsync();
                return response;
            }
            else if (lastSegment == "confirm-wire")
            {
                var confirmWireRequest = JsonConvert.DeserializeObject<ConfirmWireRequest>(request.Body);
                await MakePaymentService.ConfirmWirePayment(confirmWireRequest, vendor);
                response.Body = JsonConvert.SerializeObject(new { message = "Success" });
            }
            else if (lastSegment == "update-customer")
            {
                //update in dynamo db here
                var createCustomerRequest = JsonConvert.DeserializeObject<CardknoxUpdateCustomerApiRequest>(request.Body);
                var createCustomerResponse = await createCustomerRequest.PostToCardknox(vendor);
                response.Body = await createCustomerResponse.Content.ReadAsStringAsync();
                return response;
            }
            else if (lastSegment == "update-schedule")
            {
                var createCustomerRequest = JsonConvert.DeserializeObject<CardknoxUpdateScheduleRequest>(request.Body);
                createCustomerRequest.CustomerId = null;
                createCustomerRequest.IntervalType = null;
                createCustomerRequest.PaymentsProcessed = null;
                createCustomerRequest.IntervalCount = null;
                createCustomerRequest.AllowInitialTransactionToDecline = null;
                createCustomerRequest.CreatedDate = null;
                createCustomerRequest.CustomerNumber = null;
                var createCustomerResponse = await createCustomerRequest.PostToCardknox(vendor);
                response.Body = await createCustomerResponse.Content.ReadAsStringAsync();
                return response;
            }
            else if (lastSegment == "refund-wire")
            {
                var confirmWireRequest = JsonConvert.DeserializeObject<RefundWireRequest>(request.Body);
                await MakePaymentService.RefundWire(confirmWireRequest, vendor);
                response.Body = JsonConvert.SerializeObject(new { message = "Success" });
            }
            else if (lastSegment == "void-wire")
            {
                var confirmWireRequest = JsonConvert.DeserializeObject<VoidWireRequest>(request.Body);
                await MakePaymentService.VoidWire(vendor, confirmWireRequest);
                response.Body = JsonConvert.SerializeObject(new { message = "Success" });
            }
            else if (lastSegment == "get-invoice")
            {

                var body = await AppliedEpicDataService.GetInvoiceFromInvoiceNumberAndLookupCode(vendor, request.Body);
                response.Body = JsonConvert.SerializeObject(body);
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
                    response.Body = JsonConvert.SerializeObject(new { Message = "Success" });
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
                var id = int.Parse(request.QueryStringParameters != null &&
                         request.QueryStringParameters.TryGetValue("ClientID", out var val)
                ? val
                : "-1");
                string lookupCode = request.QueryStringParameters != null &&
                request.QueryStringParameters.TryGetValue("LookupCode", out var lookup)
                        ? lookup
                        : "";
                AppliedGetClientRequest clientResponse = new AppliedGetClientRequest();
                if (id > 0)
                    clientResponse = await AppliedGetClientRequest.CreateFromID(id, vendor);
                else
                    clientResponse = await AppliedGetClientRequest.Create(lookupCode, vendor, new GlobalLog());

                if (!string.IsNullOrEmpty(clientResponse.CSRLookupCode)) clientResponse.CSREmailAddress = await AppliedEpicReceiptService.GetCSREmailAddress(clientResponse.CSRLookupCode, vendor);
                response.Body = JsonConvert.SerializeObject(clientResponse);
                return response;
            }
            else if (lastSegment == "list-payment-methods-ext")
            {
                var paymentMethodListRequest = JsonConvert.DeserializeObject<SavedMethodsRequest>(request.Body);
                var s3 = new AmzS3Bucket(vendor.s3BucketName, "SavedMethods.jsonl");
                List<SavedMethods> savedMethods = await s3.QueryJsonLinesAsync<SavedMethods>($"s.CustomerNumber = '{paymentMethodListRequest?.AccountCode ?? ""}'");
                response.Body = JsonConvert.SerializeObject(savedMethods);
                return response;
            }
            else if (lastSegment == "create-user")
            {
                if (user?.FirstOrDefault(u => u.VendorId == vendor.Id)?.Role == "admin")
                {
                    var CognitoUser = JsonConvert.DeserializeObject<Cognito>(request.Body);
                    Console.WriteLine($"Creating user: {JsonConvert.SerializeObject(CognitoUser)}");
                    CognitoUser.AddedBy = username;
                    CognitoUser.AccountName = vendor.CardknoxAccountCode;
                    await User.CreateUserInCognitoAndDynamoDb(CognitoUser);
                    response.Body = JsonConvert.SerializeObject(new { message = "User created successfully" });

                    return response;
                }
                else
                {
                    response.StatusCode = 403;
                    response.Body = JsonConvert.SerializeObject(new { message = "Forbidden: You do not have permission to create users." });
                }
            }
            else if (lastSegment == "update-user")
            {
                if (user?.FirstOrDefault(u => u.VendorId == vendor.Id)?.Role == "admin")
                {
                    var CognitoUser = JsonConvert.DeserializeObject<Cognito>(request.Body);

                    Console.WriteLine($"Disabling user: {JsonConvert.SerializeObject(CognitoUser)}");
                    await User.UpdateUser(CognitoUser);
                    response.Body = JsonConvert.SerializeObject(new { message = "User updated successfully" });
                }
                else
                {
                    response.StatusCode = 403;
                    response.Body = JsonConvert.SerializeObject(new { message = "Forbidden: You do not have permission to disable users." });
                }
            }
            else if (lastSegment == "list-all-users")
            {
                if (user?.FirstOrDefault(u => u.VendorId == vendor.Id)?.Role == "admin")
                {
                    var users = await InsTechClassesV2.User.GetUsersAsync(vendor.Id);
                    //bool HideUser = user?.FirstOrDefault(u => u.VendorId == vendor.Id)?.Hide ?? false;
                    // users = users.Where(u => !u.Hide || HideUser ).ToList(); // exclude self
                    users = users.Where(u => !u.Hide).ToList(); // exclude self
                    response.Body = JsonConvert.SerializeObject(users);

                }
                else
                {
                    response.StatusCode = 403;
                    response.Body = JsonConvert.SerializeObject(new { message = "Forbidden: You do not have permission to update users." });
                }
                return response;
            }
            else if (lastSegment == "delete-payment-method-ext")
            {
                var req = JsonConvert.DeserializeObject<DeletePaymentMethodRequest>(request.Body);
                await MakePaymentService.DeletePaymentMethod(req.Token, vendor);
                response.Body = JsonConvert.SerializeObject(new { message = "Success" });
                return response;
            }
            else if (lastSegment == "generate-sso-code")
            {
                SSOLogin ssoLogin = JsonConvert.DeserializeObject<SSOLogin>(request.Body);
                var code = await ssoLogin.EnterIntoDynamo();
                response.Body = JsonConvert.SerializeObject(new { code });
                return response;
            }
            else if (lastSegment == "get-presigned-url")
            {
                string guid = Guid.NewGuid().ToString();
                var s3 = new AmzS3Bucket("temp-document-storage", $"temp-{guid}");
                string url = await s3.GetUploadUrlAsync();
                response.Body = JsonConvert.SerializeObject(new { uploadUrl = url, fileName = guid });
                return response;
            }
            else if (lastSegment == "analyze-policy-document")
            {
                string fileName = JsonConvert.DeserializeObject<dynamic>(request.Body)?["fileName"];
                if (string.IsNullOrEmpty(fileName))
                {
                    response.StatusCode = 400;
                    response.Body = JsonConvert.SerializeObject(new { message = "Missing fileName in request body" });
                    return response;
                }
                string jobId = await DocumentAnalysis.StartTextractJob("temp-document-storage", fileName);

                response.Body = JsonConvert.SerializeObject(new {
                    jobId
                })
                 ;
                return response;
            }
            else if (lastSegment == "get-textract-result")
            {
                string jobId = JsonConvert.DeserializeObject<dynamic>(request.Body)?["jobId"];
                if (string.IsNullOrEmpty(jobId))
                {
                    response.StatusCode = 400;
                    response.Body = JsonConvert.SerializeObject(new { message = "Missing jobId in request body" });
                    return response;
                }
                var textractResult = await DocumentAnalysis.GetTextractJobStatusAsync(jobId);
                response.Body = JsonConvert.SerializeObject(new { status = textractResult });
                return response;
            }
            else if (lastSegment == "get-bedrock-result")
            {
                string jobId = JsonConvert.DeserializeObject<dynamic>(request.Body)?["jobId"];
                if (string.IsNullOrEmpty(jobId))
                {
                    response.StatusCode = 400;
                    response.Body = JsonConvert.SerializeObject(new { message = "Missing jobId in request body" });
                    return response;
                }
                var documentRsp = await DocumentAnalysis.GetJsonResponseFromBedrockAsync(jobId);
                response.Body = documentRsp;
            }
            else if (lastSegment == "get-invoice-attachments")
            {

                var AccountGUID = request.QueryStringParameters["accountid"];
                var PolicyId = request.QueryStringParameters["policyid"];
                var iPolicyNum = int.TryParse(PolicyId, out int parsedPolicyId) ? parsedPolicyId : -1;
                string PolicyGUID = "";
                if (iPolicyNum > 0)
                {
                    var policy = new AppliedPolicyRequest(iPolicyNum);
                    await policy.GetPropertiesFromApplied(vendor);
                    PolicyGUID = policy.PolicyGUID;
                }

                var attachments = new AppliedAttachmentRequest(PolicyGUID, AccountGUID ?? "");
                var attachmentList = await attachments.GetAttachmentsAsync(vendor);
                dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject(await attachmentList.Content.ReadAsStringAsync());

                dynamic resp = new
                {
                    attachments = data,
                    policyGUID = PolicyGUID
                };
                response.Body = JsonConvert.SerializeObject(resp);
                return response;
            }
            else if (lastSegment == "make-method-default")
            {
                var req = JsonConvert.DeserializeObject<MakePaymentMethodDefaultRequest>(request.Body);
                var rsp = await MakePaymentService.SaveDefaultPaymentMethod(req.Token, req.AccountId, vendor);
                response.Body = JsonConvert.SerializeObject(rsp);
                return response;
            }
            else if (lastSegment == "get-customer-policies")
            {
                var customerId = request.QueryStringParameters["customerid"];
                var policies = await Policy.GetPoliciesByCustomerIDAsync(customerId);
                response.Body = JsonConvert.SerializeObject(policies);
                return response;
            }
            else if (lastSegment == "save-policy-fields")
            {
                dynamic reqBody = JsonConvert.DeserializeObject<dynamic>(request.Body)!;
                string policyId = reqBody["policyId"]?.ToString() ?? "";
                var fieldsJson = reqBody["fields"]?.ToString() ?? "[]";
                var fields = JsonConvert.DeserializeObject<List<InsTechClassesV2.ESign.PolicySignatureField>>(fieldsJson) ?? new List<InsTechClassesV2.ESign.PolicySignatureField>();

                var policy = await Policy.GetPolicyByIdAsync(vendor.Id.ToString(), policyId);
                if (policy == null)
                {
                    response.StatusCode = 404;
                    response.Body = JsonConvert.SerializeObject(new { message = "Policy not found" });
                    return response;
                }
                policy.SignatureFields = fields;
                await policy.UpdateDynamoAsync(vendor.Id.ToString());
                response.Body = JsonConvert.SerializeObject(new { success = true });
                return response;
            }
            else if (lastSegment == "get-signed-doc-url")
            {
                var policyId = request.QueryStringParameters?["policyid"] ?? "";
                var policy = await Policy.GetPolicyByIdAsync(vendor.Id.ToString(), policyId);
                if (policy == null || string.IsNullOrEmpty(policy.SignedPdfKey))
                {
                    response.StatusCode = 404;
                    response.Body = JsonConvert.SerializeObject(new { message = "Signed document not found" });
                    return response;
                }
                var s3 = new AmzS3Bucket("policy-uploads", policy.SignedPdfKey);
                response.Body = JsonConvert.SerializeObject(new { url = s3.GetDownloadPreSignedUrl() });
                return response;
            }

            return response;
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
            return new APIGatewayHttpApiV2ProxyResponse
            {
                Headers = new Dictionary<string, string>
                {
                    { "Access-Control-Allow-Origin", "*" },
                    { "Access-Control-Allow-Headers", "Content-Type, user, Vendor" },
                    { "Access-Control-Allow-Methods", "POST, OPTIONS, GET" },
                    { "Content-Type", "application/json" }


                },
                StatusCode = 500,
                Body = JsonConvert.SerializeObject(new { message = ex.Message })

            };

        }

    }
}
