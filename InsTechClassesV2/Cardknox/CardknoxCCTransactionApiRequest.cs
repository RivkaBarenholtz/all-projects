using Amazon.Runtime.Internal;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.Cardknox
{
    public class CardknoxCCTransactionApiRequest : CardknoxTransactionApiRequest
    {
        public override string xCommand { get; set; } = "cc:sale";
        public string? xCardNum { get; set; }
        public string xExp { get; set; }
        public string? xCvv { get; set; }
        public decimal xCustom09 { get; set; }
        public decimal xCustom10 { get; set; }
        public List<SplitInstructions> xSplitInstruction { get; set; }

    }
    public class CardknoxCCAuthApiRequest : CardknoxCCTransactionApiRequest
    {
        public override string xCommand { get; set; } = "cc:authonly";
    }

    public class CardknoxSaveCCInfoApiRequest : CardknoxApiRequest
    {
        public override string xCommand { get; set; } = "cc:save";
        protected override string path { get; set; } = "gatewayjson";
        public string xCardNum { get; set;  }
        public string xExp { get; set;  }
        public string xCvv { get; set ; }

       

    }
   
   public class CardknoxSaveCheckInfoApiRequest : CardknoxApiRequest
    {
        public override string xCommand { get; set; } = "check:save";
        protected override string path { get; set; } = "gatewayjson";
        public string xRouting { get; set;  }
        public string xAccount { get; set;  }

        public string xName { get; set;  }
    }
    public class CardknoxCCRefundApiRequest: CardknoxCCTransactionApiRequest
    {
        public override string xCommand { get; set; } = "cc:refund";
        public string xRefNum { get; set; } = "";
    }
    public class CardknoxVoidCCApiRequest : CardknoxApiRequest
    {
        public override string xCommand { get; set; } = "cc:voidrefund";
        protected override string path { get; set; } = "gatewayjson";

        public string xRefNum { get; set; } = "";
    }

    public class SplitInstructions
    {
        public decimal xAmount { get; set; }

        public string xMid { get; set; }
    }
}
