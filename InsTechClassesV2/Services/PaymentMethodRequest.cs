using Amazon.Runtime;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.Services
{
    public class PaymentMethodRequest
    {

        
    }

    public class MakePaymentMethodDefaultRequest
    {
        public string AccountId { get; set;  }
        public string Token { get; set;  }
    }

    public class DeletePaymentMethodRequest
    {
        public string Token { get; set; }
    }
}
