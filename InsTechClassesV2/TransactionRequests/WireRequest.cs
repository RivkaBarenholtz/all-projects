using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.TransactionRequests
{
    public class SubmitWireRequest
    {
        public string? RefNumber { get; set; }
        public string AccountName { get; set; }
        public string ConfNumber { get; set; }
        public DateTime? DateSent { get; set; }
        public string AccountId { get; set; }
        public string InvoiceNumber { get; set; }
        public decimal? Amount { get; set; }
        public string Notes { get; set; }
        public string CustomerName { get; set; }
        public string BillingAddress { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Zip { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string CsrCode { get; set; }
        public string CsrEmail { get; set; }
        public string CaptchaToken { get; set; }

        public bool isDevelopment { get; set; }
    }

}
