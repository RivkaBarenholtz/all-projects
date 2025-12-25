using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ins_tech
{
    public class Vendor
    {
        public int Id { get; set; }
         public string CardknoxRedirect { get; set; }
        public string apiKeySecretName { get; set; }
        public string apiSecretSecretName { get; set; }
        public string s3BucketName { get; set; }
        public string subdomain { get; set; }
        public string defaultEmail { get; set; }
        public string accessTokenSecretName { get; set; }
        public string AsiClientCorrelationId { get; set; }
        public int DepositBankAccountId { get; set; }
        public bool CreateNewReceipt { get; set; }

    }
}
