using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using AmazonUtilities;
using InsTechClassesV2.Services;
using Newtonsoft.Json;
using InsTechClassesV2.AppliedEpic;
using InsTechClassesV2;
using AmazonUtilities.DynamoDatabase;
using InsTechClassesV2.Cardknox;
using InsTechClassesV2.TransactionRequests;
using InsTechClassesV2.ESign;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace InsTechReceivePayment;

public class Function
{
    public async Task<System.Object> FunctionHandler(APIGatewayHttpApiV2ProxyRequest request, ILambdaContext context)
    {
        try
        {
            Vendor? vendor = null;

            var caseInsensitiveHeaders = new Dictionary<string, string>(request.Headers, StringComparer.OrdinalIgnoreCase);

            if (request.RequestContext?.Http?.Method?.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase) == true)
            {
                return new APIGatewayHttpApiV2ProxyResponse
                {
                    StatusCode = 200,
                    Headers = new Dictionary<string, string>
                    {
                        { "Access-Control-Allow-Origin", "*" },
                        { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
                        { "Access-Control-Allow-Methods", "POST, OPTIONS, GET" }
                    }
                };
            }

            Console.WriteLine($"Received request: {JsonConvert.SerializeObject(request)}");

            string fullPath = request.RawPath ?? "";
            string[] segments = fullPath.Split('/', StringSplitOptions.RemoveEmptyEntries);

            string lastSegment = "";
            string secondToLastSegment = "";

            if (segments.Length >= 2)
            {
                secondToLastSegment = segments[^2];
                lastSegment = segments[^1];
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
                var email = new SimpleEmail(new List<string>() { "instech101@gmail.com" }, "No vendor Found", $"Error retrieving vendor.{Environment.NewLine}Input: {JsonConvert.SerializeObject(request)}", new List<string>() { "instech101@gmail.com" });
                await email.Send();
                return "ERROR: No vendor found";
            }

            Console.WriteLine($"Last segment: {lastSegment}");

            if (lastSegment == "get-vendor")
            {
                vendor.PaymentSiteSettings.subdomain = vendor.subdomain;
                response.Body = JsonConvert.SerializeObject(vendor.PaymentSiteSettings);
                return response;
            }
            else if (lastSegment == "get-policy-by-id")
            {
                var policyId = request.QueryStringParameters?.TryGetValue("policyid", out var pid) == true ? pid : "";
                var result = await Policy.GetPolicyByIdWithPdfUrlAsync(vendor.Id.ToString(), policyId, vendor.CardknoxMerchantId);
                response.Body = JsonConvert.SerializeObject(result);
                return response;
            }
            else if (lastSegment == "get-signed-doc-url")
            {
                var policyId = request.QueryStringParameters?.TryGetValue("policyid", out var pid) == true ? pid : "";
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
            else if (lastSegment == "sign-policy")
            {
                dynamic body = JsonConvert.DeserializeObject<dynamic>(request.Body)!;
                string policyId    = body["policyId"]?.ToString() ?? "";
                string sigData     = body["signatureData"]?.ToString() ?? "";
                string signerName  = body["signerName"]?.ToString() ?? "";
                string signerEmail = body["signerEmail"]?.ToString() ?? "";
                string sigType     = body["signatureType"]?.ToString() ?? "Drawn";
                var frontendEvents = body["auditTrail"] != null
                    ? JsonConvert.DeserializeObject<List<ESignAuditEvent>>(body["auditTrail"].ToString()) ?? new List<ESignAuditEvent>()
                    : new List<ESignAuditEvent>();
                // Enrich frontend events with server-captured IP (client cannot know its own public IP)
                string ip = request.RequestContext?.Http?.SourceIp ?? "";
                foreach (var ev in frontendEvents) ev.IPAddress = ip;

                if (string.IsNullOrEmpty(policyId) || string.IsNullOrEmpty(sigData))
                {
                    response.StatusCode = 400;
                    response.Body = JsonConvert.SerializeObject(new { message = "Missing policyId or signatureData" });
                    return response;
                }

                var policy = await Policy.GetPolicyByIdAsync(vendor.Id.ToString(), policyId);
                if (policy == null)
                {
                    response.StatusCode = 404;
                    response.Body = JsonConvert.SerializeObject(new { message = "Policy not found" });
                    return response;
                }

                if (policy.IsSigned)
                {
                    response.Body = JsonConvert.SerializeObject(new { success = true, message = "Already signed" });
                    return response;
                }

                // Download original PDF
                var originalS3 = new AmzS3Bucket("policy-uploads", $"{vendor.CardknoxMerchantId}/{policyId}");
                byte[] originalBytes = await originalS3.ReadS3FileBytes();
                string originalHash = ESignRequest.ComputeHash(originalBytes);

                // Embed signature + date into PDF at stored field positions
                byte[] signedBytes = PdfSigningService.EmbedSignatures(
                    originalBytes,
                    policy.SignatureFields ?? new List<PolicySignatureField>(),
                    sigData,
                    signerName,
                    DateTime.UtcNow);

                string signedHash = ESignRequest.ComputeHash(signedBytes);

                // Upload signed PDF to S3
                string signedKey = $"{vendor.CardknoxMerchantId}/{policyId}-signed";
                var signedS3 = new AmzS3Bucket("policy-uploads", signedKey);
                await signedS3.UploadFileToS3(Convert.ToBase64String(signedBytes), "application/pdf");

                // Create audit record
               caseInsensitiveHeaders.TryGetValue("user-agent", out var userAgent);

                var esignReq = new ESignRequest
                {
                    VendorId = vendor.Id.ToString(),
                    PolicyId = policy.Id,
                    PolicyCode = policy.PolicyCode,
                    SignerName = signerName,
                    SignerEmail = signerEmail,
                    DocumentHash = originalHash,
                    SignedDocumentHash = signedHash,
                    Status = "Completed",
                    Parties = new List<ESignParty>
                    {
                        new ESignParty
                        {
                            Name = signerName,
                            Email = signerEmail,
                            Role = "Insured",
                            Order = 1,
                            Status = "Signed",
                            SignedAt = DateTime.UtcNow.ToString("o"),
                            IPAddress = ip,
                            UserAgent = userAgent,
                            SignatureType = sigType
                        }
                    },
                    AuditEvents = new List<ESignAuditEvent>(frontendEvents)
                    {
                        new ESignAuditEvent { EventType = "Signed", IPAddress = ip, UserAgent = userAgent,
                            SignerName = signerName, SignerEmail = signerEmail,
                            Metadata = $"{signerName} signed on payment page | IP: {ip} | Type: {sigType}" }
                    }
                };
                await esignReq.SaveAsync();

                // Mark policy as signed
                policy.IsSigned = true;
                policy.SignedPdfKey = signedKey;
                await policy.UpdateDynamoAsync(vendor.Id.ToString());

                // Email signed document to signer
                if (!string.IsNullOrEmpty(signerEmail))
                {
                    var emailBody = $@"<p>Dear {signerName},</p>
<p>Thank you for signing your policy document. Your signed policy is attached for your records.</p>
<p>If you have any questions, please contact your insurance agent.</p>";
                    var notification = new SimpleEmail(
                        new List<string> { signerEmail },
                        "Your Signed Policy Document",
                        emailBody,
                        new List<string>()
                    );
                    notification.attachmentFiles.Add(new SimpleEmail.AttachmentFile
                    {
                        FileName = $"signed_policy_{policy.PolicyCode}.pdf",
                        FileContent = signedBytes
                    });
                    await notification.Send();
                }

                response.Body = JsonConvert.SerializeObject(new { success = true });
                return response;
            }
            else if (lastSegment == "get-surcharge")
            {
                if (vendor.NoSurcharge)
                { 
                    var rsp = new { surcharge = 0, vendorSurcharge = 0  };
                    response.Body = JsonConvert.SerializeObject(rsp);
                    return response;
                }

                var surcharge = await MakePaymentService.GetClientSurcharge(request.Body, vendor);
                response.Body = JsonConvert.SerializeObject(new { surcharge, vendorSurcharge = vendor.InsureTechFeePercentage });
                return response;
            }
            else if (lastSegment == "get-open-invoices")
            {
                var openInvoices = await AppliedEpicDataService.GetInvoiceList(vendor, request.Body);
                response.Body = JsonConvert.SerializeObject(openInvoices);
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
                var id = int.Parse(request.QueryStringParameters?.TryGetValue("ClientID", out var cid) == true ? cid : "-1");
                string lookupCode = request.QueryStringParameters?.TryGetValue("LookupCode", out var lc) == true ? lc : "";
                AppliedGetClientRequest clientResponse;
                if (id > 0)
                    clientResponse = await AppliedGetClientRequest.CreateFromID(id, vendor);
                else
                    clientResponse = await AppliedGetClientRequest.Create(lookupCode, vendor, new GlobalLog());

                if (!string.IsNullOrEmpty(clientResponse.CSRLookupCode))
                    clientResponse.CSREmailAddress = await AppliedEpicReceiptService.GetCSREmailAddress(clientResponse.CSRLookupCode, vendor);

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
                var b = await digitalPaymentResponse.Content.ReadAsStringAsync();
                response.Body = b;
                return response;
            }
            else if (lastSegment == "get-invoice")
            {
                var b = await AppliedEpicDataService.GetInvoiceFromInvoiceNumberAndLookupCode(vendor, request.Body);
                response.Body = JsonConvert.SerializeObject(b);
                return response;
            }
            else if (lastSegment == "submit-wire")
            {
                await MakePaymentService.SaveWireTransaction(request.Body, vendor);
                response.Body = JsonConvert.SerializeObject(new { message = "Success" });
                return response;
            }
            else if (lastSegment == "get-ref-num")
            {
                var refNum = await WireRefNumGenerator.GenerateRefNumberAsync();
                response.Body = JsonConvert.SerializeObject(new { refNum });
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
