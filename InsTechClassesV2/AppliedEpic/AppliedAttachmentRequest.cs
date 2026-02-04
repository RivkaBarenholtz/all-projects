using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.AppliedEpic
{
   public class AppliedAttachmentRequest
    {
        private static string _url= "https://api.myappliedproducts.com/epic/attachment/v2/attachments"; 
        
        public string  PolicyGUID { get; set; }
        public string AccountGUID { get; set; }

    }
}
