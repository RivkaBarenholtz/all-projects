using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.TransactionRequests
{
    public class ReceiveDigitalPaymentRequest: ReceivePaymentRequest
    {
        public decimal Amount { get; set; }
        public string CardNumber { get; set; }
        public string City { get; set; }
        public string Street { get; set; }
        public string State { get; set; }
        public string Zip { get; set; }
        public string FirstName { get; set; }

    }

}
