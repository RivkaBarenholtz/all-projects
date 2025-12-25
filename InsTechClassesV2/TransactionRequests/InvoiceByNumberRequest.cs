using Amazon.S3.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.TransactionRequests
{ 
    public class InvoiceByNumberRequest
    {
        public List<int> InvoiceNumber { get; set; }
        public string LookupCode { get; set; }
        public int AccountId { get; set; } = 0;

    }
}
