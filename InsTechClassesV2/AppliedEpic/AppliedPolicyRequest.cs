using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Net.WebRequestMethods;

namespace InsTechClassesV2.AppliedEpic
{
    public class AppliedPolicyRequest
    {
        private static string _url = "https://api.myappliedproducts.com/sdk/v1/policies";
        public int PolicyID { get; set; }

        public AppliedPolicyRequest() { }
        public AppliedPolicyRequest(int policyId)
        {
            PolicyID = policyId;
        }

        public string PolicyGUID { get; set; }

        public async Task GetPropertiesFromApplied (Vendor vendor)
        {
            var policyResponse = await AppliedApiClient.GetObject($"{_url}/{PolicyID}", new Dictionary<string, string>(), vendor );
            if (policyResponse.IsSuccessStatusCode)
            {
                var policyContent = await policyResponse.Content.ReadAsStringAsync();
                var policyJson = Newtonsoft.Json.Linq.JObject.Parse(policyContent);

                PolicyGUID = policyJson["Envelope"]?["Body"]?["Get_PolicyResponse"]?["Get_PolicyResult"]?["Policies"]?["Policy"]?["PolicyGUID"]?.ToString()??"";
            }
        }
    }
}
