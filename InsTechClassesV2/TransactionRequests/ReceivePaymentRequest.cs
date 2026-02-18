using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.TransactionRequests
{
   public abstract class ReceivePaymentRequest
    {
        public string CaptchaToken { get; set; }
        public Boolean isDevelopment { get; set; }  
        public string CSRCode { get; set; } = "";
        public string CSREmail { get; set; } = "";
        public string InvoiceNumber { get; set; }
        public string AccountID { get; set; } = "";
        public string CardHolderName { get; set; } = "";
        public string Zip { get; set; } = "";

        public string Token { get; set; }
        public string Software { get; set; }
        public string BillingAddress { get; set; } = "";
        public string City { get; set; } = "";
        public string State { get; set; } = "";
        public string Email { get; set; } = "";
        public string Notes { get; set; } = "";
        public string Phone { get; set; } = "";

        public bool SavePaymentMethod { get; set; } = false;
        public bool IsDefault { get; set;  }

    }
}
