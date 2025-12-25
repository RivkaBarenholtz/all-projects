using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.Cardknox
{
    public class CardknoxResponse
    {
        public string xResult { get; set; }
        public string xStatus { get; set; }
        public string xError { get; set; }
        public string xErrorCode { get; set; }
        public string xRefNum { get; set; }
        public string xExp { get; set; }
        public string xDate { get; set; }
        public string xToken { get; set; }
        public string xMaskedCardNumber { get; set; }
        public string xCardType { get; set; }
    }
}
