using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
   public class SavedMethods
    {
        public string Token { get; set; }  
        public string CustomerNumber { get; set; }
        public string Exp { get; set; } 
        public string MaskedAccountNumber { get; set; }
        public String CardType { get; set; }

        public Boolean isDefault { get; set;  } 
    }
}
