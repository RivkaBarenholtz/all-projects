using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.TransactionRequests
{
   public  class EmailReceiptRequest
    {
        public List<string> EmailAddresses { get; set; } = new List<string>();
        public Cardknox.CardknoxReportItem Transaction {  get; set; } 
    }
}
