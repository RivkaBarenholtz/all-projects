using Amazon.Runtime;
using Amazon.Runtime.Internal.Util;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace InsTech
{
   public  class AppliedGetClientRequest
    {
        public  AppliedGetClientRequest(string _lookupCode)
        {
            this.LookupCode = _lookupCode;
            
        }
        private async static Task<AppliedGetClientRequest> CreateClientFromEpicResponse(HttpResponseMessage response, Vendor vendor)
        {
            var client = new AppliedGetClientRequest();
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                dynamic data = JsonConvert.DeserializeObject<dynamic>(content);
                dynamic epicClient = data["Envelope"]["Body"]["Get_ClientResponse"]["Get_ClientResult"]["Clients"]["Client"];
                if (epicClient == null)
                {
                    return null;
                }
                else if (epicClient is JArray)
                {
                    if (epicClient.Count == 1)
                    {
                        client.SetPropertiesFromAppliedResponse(epicClient[0], vendor.AgencyCode);
                    }
                    else
                    {
                        return null;
                    }
                }
                else if (epicClient is JObject)
                {
                    client.SetPropertiesFromAppliedResponse(epicClient, vendor.AgencyCode);
                }

            }
            else
            {
                return null;
            }
            return client;
        }


        private static async Task<AppliedGetClientRequest> CreateClientFromEpic(string _lookupCode, Vendor vendor, bool tryName)
        {
            var client = new AppliedGetClientRequest(_lookupCode);

            HttpResponseMessage response;
            if (!tryName)
            {
                response = await client.GetFromApplied(vendor);
            }
            else
            {
                response = await client.GetFromAppliedWithName(vendor);
            }

           return CreateClientFromEpicResponse(response, vendor);
        }

        public static async Task<AppliedGetClientRequest> Create(string _lookupCode, Vendor vendor)
        {
            var client = new AppliedGetClientRequest(_lookupCode);
            var response = await client.GetFromApplied(vendor);
          
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                dynamic data =  JsonConvert.DeserializeObject<dynamic>(content);
                if (data["Envelope"]["Body"]["Get_ClientResponse"]["Get_ClientResult"]["Clients"]["Client"]==null){
                    return null;
                }
                client.AgencyCode = data["Envelope"]["Body"]["Get_ClientResponse"]["Get_ClientResult"]["Clients"]["Client"]["AccountValue"]["Structure"]["AgencyStructureItem"]["AgencyCode"];
                client.BranchCode = data["Envelope"]["Body"]["Get_ClientResponse"]["Get_ClientResult"]["Clients"]["Client"]["AccountValue"]["Structure"]["AgencyStructureItem"]["BranchCode"];
                
            }
            return client;

        }
        public string LookupCode { get; set;  }
        public string BranchCode { get; set; }
        public string AgencyCode { get; set; }
        public string ClientName { get; set; }
        private string _url = "https://api.myappliedproducts.com/sdk/v1/clients";
        public async Task<HttpResponseMessage> GetFromApplied(Vendor vendor)
        {
            var queryParams = new Dictionary<string, string> 
            { 
                {"LookupCode", LookupCode }, 
                {"IncludeActive", "True" }, 
                {"IncludeInactive", "False" } 
           };
            return await AppliedApiClient.GetObject(_url,queryParams, vendor );
           
        }
    }
}
