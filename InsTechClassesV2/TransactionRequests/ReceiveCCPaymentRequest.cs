using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.TransactionRequests  
{
    public class ReceiveCCPaymentRequest:ReceivePaymentRequest
    {
        public decimal Subtotal { get; set; }
        public decimal Surcharge { get; set; }
        
        public string CardNumber { get; set; }
        public string ExpDate { get; set; }
        public string CVV { get; set; } 
        
        
    }
    public class ReceiveRefundRequest : ReceivePaymentRequest
    {
        public string OriginalTransaction { get; set; } = "";
        public bool IsCheck { get; set; } = true; 
        public decimal Subtotal { get; set; }
        public decimal Surcharge { get; set; }
        public decimal Amount { get; set; }
    }
    public class ReceiveVoidRequest
    {
        public string OriginalTransaction { get; set; } = "";
        public bool IsCheck { get; set; } = true; 
    }

}
