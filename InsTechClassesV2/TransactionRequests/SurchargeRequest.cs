using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.TransactionRequests
{
    public class SurchargeRequest
    {
        public string ClientLookupCode { get; set; }
        public int InvoiceNumber { get; set; }
    }
}
