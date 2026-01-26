using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.Cardknox
{
    public abstract class CardknoxTransactionApiRequest:CardknoxApiRequest
    {
        protected override string path { get; set; } = "gatewayjson";
        public decimal xAmount { get; set; }
        public string xBillLastName { get; set; }
        public string xInvoice { get; set; }
        public string xCustom02 { get; set; }
        public string xCustom03{ get; set; }
        public string xStreet { get; set; } = "";
        public string xZip { get; set; }
        public string xName { get; set; } = "";
        public string xBillCity { get; set; } = "";
        public string xBillPhone { get; set; } = "";
        public string xBillState { get; set; } = "";
        public string xEmail { get; set; } = "";
        public string? xToken { get; set; }

    }
  
}
