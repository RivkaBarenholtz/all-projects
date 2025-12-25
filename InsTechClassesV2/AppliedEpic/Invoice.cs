using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.AppliedEpic
{
   public class Invoice
    {
        public int AppliedEpicInvoiceNumber  {get;set;}
        public decimal Balance { get; set; }
        public decimal Surcharge { get; set; }
        public decimal InvoiceTotal { get; set; }
        public Boolean IsEditable { get; set; } = true;
    }
}
