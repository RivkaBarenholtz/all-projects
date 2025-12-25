using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
   public class VendorPaymentSiteSettings
    {
        public Boolean isAmountEditable {  get; set; }
        public List<string> RequiredFields { get; set; }
        public string CardknoxIFeildsKey { get; set; }
        public string LogoUrl { get; set; }
        public string MobileLogoUrl { get; set; }

        public BankInfo BankInfo { get; set; }
    }

    public class BankInfo
    {
        public string BankName { get; set;  }
        public string BankNum { get; set; }
        public string AccountNum { get; set; }
        public string Routing { get; set; }
        public string NameOnAccount { get; set; }
        public string Address { get; set; }
        public string CityStateZip { get; set; }
    }
}
