using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.TransactionRequests
{
    public class UpdateSurchargeRequest:SurchargeRequest
    {
        public decimal SurchargeAmount { get; set; }
        public Boolean IsEditable { get; set; }

        public int AccountID { get; set; }
    }
}
