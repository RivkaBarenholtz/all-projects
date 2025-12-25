using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.TransactionRequests
{
    public class ReceiveACHPaymentRequest:ReceivePaymentRequest
    {
       public string AccountNumber { get; set; }
        public decimal Amount { get; set; }
        public string RoutingNumber { get; set; }
        public string AccountName { get; set; }

        public string AccountType { get; set; }
        



    }
}
