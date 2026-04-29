using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using FinanceProIntegration;
using System.Threading.Tasks;
using System.Xml.Linq;
using System.Xml.Serialization;
using System.Xml;
using Newtonsoft.Json;
using System.Net;
using Amazon.Auth.AccessControlPolicy;
using AmazonUtilities;

namespace InsTechClassesV2.FinancePro
{
    public class FinanceProService
    {


        const string ns = "http://www.financepro.com/financepro/WebServices/";

        // Try both � some nodes on the load balancer serve HTTP, others require HTTPS
        const string endpoint = "https://secure.financepro.net/financepro/webservices/QuoteService.asmx";

       

       
static string ToXml<T>(T obj, XmlRootAttribute? root = null)
        {
            var sb = new StringBuilder();
            var serializer = root is null ? new XmlSerializer(typeof(T)) : new XmlSerializer(typeof(T), root);
            var xns = new XmlSerializerNamespaces(new[] { new XmlQualifiedName("", ns) });
            using var writer = XmlWriter.Create(sb, new XmlWriterSettings { OmitXmlDeclaration = true, Indent = true });
            serializer.Serialize(writer, obj, xns);
            return sb.ToString();
        }

        static Results? DeserializeResult(string responseXml)
        {
            var doc = XDocument.Parse(responseXml);
            XNamespace fpNs = "http://www.financepro.com/financepro/WebServices/";
            var resultElement = doc.Descendants(fpNs + "SubmitQuoteResult").FirstOrDefault();
            if (resultElement == null) return null;

            var serializer = new XmlSerializer(typeof(Results), new XmlRootAttribute("SubmitQuoteResult") { Namespace = "http://www.financepro.com/financepro/WebServices/" });
            using var reader = resultElement.CreateReader();
            return (Results?)serializer.Deserialize(reader);
        }
        static AuthHeader BuildAuthHeader() => new AuthHeader
        {
            Key = "/ZVdG/Ci0AnHM3oifcYsHKyr/vF2Ji9n9b/km2iGLbs=",
            Login = new FinanceProIntegration.Login
            {
                LoginName = "instech360",
                LoginPassword = "Agileit360api2026$",
                UserID = 0
            },
            SiteID = 1935,
            LogImport = true
        };

        static HttpClient BuildHttpClient()
        {
            bool isLocal = Environment.GetEnvironmentVariable("AWS_SAM_LOCAL") == "true";
            var handler = new HttpClientHandler
            {
                AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate | DecompressionMethods.Brotli
            };
            Console.WriteLine("This is the environment I am working in");
            Console.WriteLine(isLocal ? "SAM_LOCAL" : "Not local");
            if (isLocal)
                handler.ServerCertificateCustomValidationCallback = (_, _, _, _) => true;
            return new HttpClient(handler);
        }

        public static async Task<string> GetQuoteAgreementUrlAsync(int quoteId)
        {
            var auth = BuildAuthHeader();
            var soap = $"""
    <?xml version="1.0" encoding="utf-8"?>
    <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="{ns}">
      <SOAP-ENV:Header>
        <ns1:AuthHeader>
          <ns1:Key>{auth.Key}</ns1:Key>
          <ns1:Login>
            <ns1:FirstName />
            <ns1:LastName />
            <ns1:Email />
            <ns1:Phone />
            <ns1:LoginName>{auth.Login.LoginName}</ns1:LoginName>
            <ns1:LoginPassword>{auth.Login.LoginPassword}</ns1:LoginPassword>
            <ns1:UserID>0</ns1:UserID>
          </ns1:Login>
          <ns1:SiteID>{auth.SiteID}</ns1:SiteID>
          <ns1:LogImport>{auth.LogImport.ToString().ToLower()}</ns1:LogImport>
        </ns1:AuthHeader>
      </SOAP-ENV:Header>
      <SOAP-ENV:Body>
        <ns1:GetQuoteAgreementURL>
          <ns1:quoteID>{quoteId}</ns1:quoteID>
        </ns1:GetQuoteAgreementURL>
      </SOAP-ENV:Body>
    </SOAP-ENV:Envelope>
    """;

            using var http = BuildHttpClient();
            var req = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = new StringContent(soap, Encoding.UTF8, "text/xml")
            };
            req.Headers.Add("SOAPAction", $"\"{ns}GetQuoteAgreementURL\"");

            var response = await http.SendAsync(req);
            var body = await response.Content.ReadAsStringAsync();

            var doc = XDocument.Parse(body);
            XNamespace fpNs = ns;
            var url =  doc.Descendants(fpNs + "GetQuoteAgreementURLResult").FirstOrDefault()?.Value ?? "";


            
            Console.WriteLine("GOT ALL THE WAY HERE!!!");
            // Proxy the PDF through S3 so the browser can load it without CORS issues
            using var http2 = BuildHttpClient();
            var pdfBytes = await http.GetByteArrayAsync(url);
            var s3Key = $"temp-finance-agreements/{quoteId}-{Guid.NewGuid()}.pdf";
            var s3 = new AmzS3Bucket("temp-document-storage", s3Key);
            await s3.UploadBytesAsync(pdfBytes, "application/pdf");
            return s3.GetDownloadPreSignedUrl();
        }

        public static async Task<FinanceQuote> SubmitQuoteForPolicyAsync(Policy policy, Vendor vendor)
        {
            if (string.IsNullOrEmpty(vendor.FinanceProName) || string.IsNullOrEmpty(vendor.FinanceProSearchCode))
                return null;

            var authHeader = BuildAuthHeader();

            var customer = policy.Customer;
            var insuredName = $"{customer.BillFirstName} {customer.BillLastName}".Trim();
            if (string.IsNullOrEmpty(insuredName)) insuredName = customer.BillCompany ?? "";

            var searchCodeSource = !string.IsNullOrEmpty(customer.CustomerId) ? customer.CustomerId : insuredName.Replace(" ", "-");
            var insuredSearchCode = searchCodeSource[..Math.Min(20, searchCodeSource.Length)];

            var agency = new FinanceProIntegration.Agency
            {
                Name = vendor.FinanceProName,
                SearchCode = vendor.FinanceProSearchCode,
                Zip = vendor.ZipCode ?? "",
                AddIfNotFound = false
            };

            var insured = new FinanceProIntegration.Insured
            {
                SearchCode = insuredSearchCode,
                Name = insuredName,
                Address1 = customer.BillStreet ?? "",
                City = customer.BillCity ?? "",
                State = customer.BillState ?? "",
                Country = "US",
                Zip = customer.BillZip ?? "",
                Phone = customer.BillPhoneNumber ?? customer.BillPhone ?? "",
                RiskAddress1 = customer.BillStreet ?? "",
                RiskCity = customer.BillCity ?? "",
                RiskState = customer.BillState ?? "",
                RiskZip = customer.BillZip ?? "",
                RiskCountry = "US"
            };

            var fpPolicy = new FinanceProIntegration.Policy
            {
                InceptionDate = policy.PolicyStartDate ?? DateTime.Now,
                ExpirationDate = policy.PolicyEndDate ?? DateTime.Now.AddYears(1),
                CoverageType = !string.IsNullOrEmpty(policy.InsuranceType) ? policy.InsuranceType
                             : !string.IsNullOrEmpty(policy.PolicyDescription) ? policy.PolicyDescription
                             : "GENERAL LIABILITY",
                GrossPremium = policy.Amount,
                MinEarnedPercent = 25,
                PolicyTerm = 12,
                PolicyType = FinanceProIntegration.PolicyType.Normal,
                ShortRate = false,
                Auditable = false,
                CancelTerms = 10,
                PUCFilings = false,
                InsuranceCompany = new FinanceProIntegration.InsuranceCompany
                {
                    Name = !string.IsNullOrEmpty(policy.CarrierName) ? policy.CarrierName : "Scottsdale Insurance Company",
                    SearchCode = !string.IsNullOrEmpty(policy.CarrierSearchCode) ? policy.CarrierSearchCode : "003292",
                    Zip = !string.IsNullOrEmpty(policy.CarrierZip) ? policy.CarrierZip : "43218"
                }
            };

            var quote = new FinanceProIntegration.Quote
            {
                AccountType = FinanceProIntegration.AccountType.Personal,
                Agency = agency,
                Insured = insured,
                PaymentFrequency = FinanceProIntegration.PaymentType.Monthly,
                InsuredPaymentMethod = FinanceProIntegration.InsuredPaymentType.Unspecified,
                OverrideCalc = false,
                Locked = false,
                CalculateQuote = true,
                StateForLaws = FinanceProIntegration.StateForLaws.InsuredRisk,
                SaveQuote = true,
                Policies = new[] { fpPolicy }
            };

            var soap = $"""
    <?xml version="1.0" encoding="utf-8"?>
    <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="{ns}">
      <SOAP-ENV:Header>
        <ns1:AuthHeader>
          <ns1:Key>{authHeader.Key}</ns1:Key>
          <ns1:Login>
            <ns1:FirstName />
            <ns1:LastName />
            <ns1:Email />
            <ns1:Phone />
            <ns1:LoginName>{authHeader.Login.LoginName}</ns1:LoginName>
            <ns1:LoginPassword>{authHeader.Login.LoginPassword}</ns1:LoginPassword>
            <ns1:UserID>0</ns1:UserID>
          </ns1:Login>
          <ns1:SiteID>{authHeader.SiteID}</ns1:SiteID>
          <ns1:LogImport>{authHeader.LogImport.ToString().ToLower()}</ns1:LogImport>
        </ns1:AuthHeader>
      </SOAP-ENV:Header>
      <SOAP-ENV:Body>
        <ns1:SubmitQuote>
          {ToXml(quote, new XmlRootAttribute("q") { Namespace = ns })}
          <ns1:replaceExisting>false</ns1:replaceExisting>
        </ns1:SubmitQuote>
      </SOAP-ENV:Body>
    </SOAP-ENV:Envelope>
    """;

            Console.WriteLine("=== Request ===");
            //Console.WriteLine(soap);
            Console.WriteLine();
            using var http = BuildHttpClient();
            var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = new StringContent(soap, Encoding.UTF8, "text/xml")
            };
            request.Headers.Add("SOAPAction", $"\"{ns}SubmitQuote\"");

            var response = await http.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();



            
            var result = DeserializeResult(body);
            Console.WriteLine(JsonConvert.SerializeObject(result, Newtonsoft.Json.Formatting.Indented));

            var q = result?.Quote;
            if (q == null) return null;

            return new FinanceQuote
            {
                Company = "Agile-Pf",
                QuoteId = result.QuoteID,
                DownPaymentAmount = q.DownPayment,
                DownPaymentPercent = q.TotalGrossPremium > 0 ? Math.Round(q.DownPayment / q.TotalGrossPremium * 100, 2) : 0,
                AmountFinanced = q.AmountFinanced,
                MonthlyPayment = q.PaymentAmount,
                APR = (decimal)q.EffectiveAPR,
                Term = q.NumberOfPayments,
                TotalAmount = q.TotalGrossPremium
            };
        }


    }
}
