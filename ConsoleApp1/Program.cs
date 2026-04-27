using System.Text;
using System.Xml;
using System.Xml.Linq;
using System.Xml.Serialization;
using FinanceProIntegration;
using Newtonsoft.Json;

const string ns = "http://www.financepro.com/financepro/WebServices/";

// Try both � some nodes on the load balancer serve HTTP, others require HTTPS
const string endpoint = "https://secure.financepro.net/financepro/webservices/QuoteService.asmx";

var authHeader = new AuthHeader
{
    Key = "/ZVdG/Ci0AnHM3oifcYsHKyr/vF2Ji9n9b/km2iGLbs=",
    Login = new Login { LoginName = "instech360", LoginPassword = "Agileit360api2026$" },
    SiteID = 1935,
    LogImport = true
};

var quote = new Quote
{
    AccountType = AccountType.Personal,
    Agency = new Agency { Name = "IT360 Test Agent", SearchCode = "Test-it360", Zip = "31524", AddIfNotFound = false },
    Insured = new Insured
    {
        SearchCode = "Secofid-01",
        Name = "Second Fiddle",
        Address1 = "123 Main St",
        City = "Anytown",
        State = "CA",
        Country = "US",
        Zip = "90210",
        Phone = "555-123-4567",
        RiskAddress1 = "123 Main St",
        RiskCity = "Anytown",
        RiskState = "CA",
        RiskZip = "90210",
        RiskCountry = "US"
    },
    PaymentFrequency = PaymentType.Monthly,
    InsuredPaymentMethod = InsuredPaymentType.Unspecified,
    OverrideCalc = false,
    Locked = false,
    CalculateQuote = true,
    StateForLaws = StateForLaws.InsuredRisk,
    SaveQuote = true,
    Policies = new[]
    {
        new Policy
        {
            InceptionDate = DateTime.Now, ExpirationDate = DateTime.Now.AddYears(1),
            CoverageType = "GENERAL LIABILITY", GrossPremium = 5000.00m,
            MinEarnedPercent = 25, PolicyTerm = 12, PolicyType = PolicyType.Normal,
            ShortRate = false, Auditable = false, CancelTerms = 10, PUCFilings = false,
            InsuranceCompany = new InsuranceCompany { Name = "Scottsdale Insurance Company", SearchCode = "003292", Zip = "43218" }
        }
    }
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
Console.WriteLine(soap);
Console.WriteLine();

using var http = new HttpClient();
var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
{
    Content = new StringContent(soap, Encoding.UTF8, "text/xml")
};
request.Headers.Add("SOAPAction", $"\"{ns}SubmitQuote\"");

Console.WriteLine("=== Request Headers ===");
Console.WriteLine($"Content-Type: {request.Content.Headers.ContentType}");
Console.WriteLine($"SOAPAction:   {string.Join(", ", request.Headers.GetValues("SOAPAction"))}");
Console.WriteLine();

var response = await http.SendAsync(request);
var body = await response.Content.ReadAsStringAsync();



Console.WriteLine("=== Response ===");
Console.WriteLine($"Status:       {(int)response.StatusCode} {response.StatusCode}");
Console.WriteLine();

var result = DeserializeResult(body);
Console.WriteLine(JsonConvert.SerializeObject(result, Newtonsoft.Json.Formatting.Indented));

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