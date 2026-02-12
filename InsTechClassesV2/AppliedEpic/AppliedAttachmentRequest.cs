using Amazon.Runtime.Internal.Transform;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.AppliedEpic
{
    public class AppliedAttachmentRequest
    {
        private static string _url = "https://api.myappliedproducts.com/epic/attachment/v2/attachments";

        public AppliedAttachmentRequest() { }
        public AppliedAttachmentRequest(string policyGUID, string accountGUID)
        {
            PolicyGUID = policyGUID;
            AccountGUID = accountGUID;
        }


        public string PolicyGUID { get; set; }
        public string AccountGUID { get; set; }

        public async Task<HttpResponseMessage> GetAttachmentsAsync(Vendor vendor)
        {

            var queryParams = new Dictionary<string, string>
            {
                { "policy", PolicyGUID },
                { "account", AccountGUID },
                { "description_contains" , "Invoice" }, 
                { "systemGenerated" , "true" }

            };
            return await AppliedApiClient.GetObject(_url, queryParams, vendor);

        }
    }
}
