using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using FinanceProIntegration;
using System.Threading.Tasks;

namespace InsTechClassesV2.FinancePro
{
    public class FinanceProService
    {
        public static async Task<SubmitQuoteResponse> GenerateQuoteAsync()
        {
            var login = new FinanceProIntegration.Login
            {
                LoginName = "instech360",
                LoginPassword = "Agileit360api2026$"
            };
            var authheader = new FinanceProIntegration.AuthHeader
            {
                Key = "/ZVdG/Ci0AnHM3oifcYsHKyr/vF2Ji9n9b/km2iGLbs=",
                Login = login,
                SiteID = 1935,
                LogImport = true

            };
            var agency = new Agency
            {
                Name = "IT360 Test Agent",
                SearchCode = "Test-it360",
                Zip = "31524",
                AddIfNotFound = false

            };
            var insured = new Insured
            {
                SearchCode = "Secofid-01",
                Name = "Second Fiddle",
                Address1 = "123 Main St",
                City = "Anytown",
                State = "CA",
                Country = "US",
                Zip = "90210",
                Phone = "5551234567",
                RiskAddress1 = "123 Main St",
                RiskCity = "Anytown",
                RiskState = "CA",
                RiskZip = "90210",
                RiskCountry = "US"
            };
            var quote = new Quote
            {
                AccountType = AccountType.Personal,
                Agency = agency,
                Insured = insured,
                PaymentFrequency = PaymentType.Monthly,
                InsuredPaymentMethod = InsuredPaymentType.Unspecified,
                OverrideCalc = false,
                Locked = false,
                CalculateQuote = true,
                StateForLaws = StateForLaws.InsuredRisk,
                Policies = new FinanceProIntegration.Policy[]
                {
                    new FinanceProIntegration.Policy
                    {
                      InceptionDate = DateTime.Now,
                        ExpirationDate = DateTime.Now.AddYears(1),
                        CoverageType= "GENERAL LIABILITY",
                        GrossPremium= 5000.00m,
                        MinEarnedPercent = 25,
                        PolicyTerm = 12,
                        PolicyType = PolicyType.Normal,
                        ShortRate = false,
                        Auditable = false,
                        CancelTerms = 10 ,
                        PUCFilings = false ,
                        InsuranceCompany = new InsuranceCompany
                        {
                            Name = "Scottsdale Insurance Company",
                           SearchCode = "003292",
                           Zip = "43218"
                        },

                    }
                },
                SaveQuote = true



            };
            var client = new FinanceProIntegration.QuoteServiceSoapClient(QuoteServiceSoapClient.EndpointConfiguration.QuoteServiceSoap);
            
            
            var response = await client.SubmitQuoteAsync(authheader, quote, false);
            return response;
        }
    }
}
