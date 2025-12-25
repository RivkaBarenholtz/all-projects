using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.Cardknox
{
    public class CardknoxCheckTransactionApiRequest: CardknoxTransactionApiRequest
    {
        public override string xCommand { get; set; } = "check:sale";
        public string? xRouting { get; set; }
        public string? xAccount { get; set; }
        public string? xName { get; set; }
        public string? xAccountType { get; set; }

    }
}
