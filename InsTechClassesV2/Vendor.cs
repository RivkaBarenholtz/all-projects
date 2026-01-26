using Amazon.SecretsManager.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
    public class Vendor
    {
        public int Id { get; set; }
         public string CardknoxRedirect { get; set; }
        public string AppliedApiKeySecretName { get; set; }
        public string AppliedApiSecretSecretName { get; set; }
        public string s3BucketName { get; set; }
        public string subdomain { get; set; }
        public List<string> defaultEmail { get; set; }
        public string accessTokenSecretName { get; set; }
        public string AsiClientCorrelationId { get; set; }
        public int DepositBankAccountId { get; set; }
        public bool CreateNewReceipt { get; set; }
        public bool Exclude { get; set;  }
        public string CardknoxApiKeySecretName { get; set; }

        public decimal InsureTechFeePercentage { get; set; } 

        public string DummyAccountCode { get; set; }
        public string CardknoxAccountCode { get; set; }
        public string AgencyCode { get; set; }

        public string SecondaryAgencyCode { get; set; }
        public bool IsInstructional { get; set; }
        public int CardknoxMerchantId { get; set; }
        public VendorPaymentSiteSettings PaymentSiteSettings { get; set; }

        public decimal CardknoxFeePercentage { get; set; } 
        
        public Boolean UsesEpicApi { get; set; }
        public string EpicSubdomain { get; set; }
        public string EpicUserName { get; set; }
        public string EpicPassword { get; set; }

        public string CompanyName { get; set;  }
        public string CompanyAddress { get; set; }
        public string CompanyPhone { get; set; }
        public string CompanyEmail { get; set; }
        public string SecondaryDomain { get; set; } = "SECONDARYDOMAIN";
        public string CompanyCityStateZip { get; set; }
    }
}
