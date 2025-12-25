using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.AppliedEpic
{
    public class ScrapeAppliedEpicReceipt
    {
        public int bankAccountNumber { get; set; }
       
        public Boolean isDebit { get; set; }
        public string description { get; set; } 
        public string detailDescription { get; set; } 
        public decimal amount { get; set; }
        public string paymentMethod { get; set; }
         public string cardknoxRefNum { get; set; }
        public string clientLookupCode { get; set; }
        public string enterpriseId { get; set; }
        public string userName { get; set; }
        public string password { get; set; }    
    }
}
