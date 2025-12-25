using Amazon.Runtime;
using Amazon.Runtime.Internal.Util;
using InsTechClassesV2.Api;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Numerics;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.AppliedEpic
{
   public  class AppliedGetClientRequest
    {
        public  AppliedGetClientRequest(string _lookupCode)
        {
            this.LookupCode = _lookupCode;
            
        }
        public AppliedGetClientRequest() { }
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

            return await CreateClientFromEpicResponse(response, vendor);
        }
        private void SetPropertiesFromAppliedResponse(dynamic EpicClient, string vendorAgencyCode)
        {
            ClientID = EpicClient["ClientID"] ?? 0;
            var agencyStructure = EpicClient["AccountValue"]["Structure"]["AgencyStructureItem"];
            if (agencyStructure is JArray)
            {
                foreach (var item in agencyStructure)
                {
                    if ((string?)item["AgencyCode"] == vendorAgencyCode)
                    {
                        AgencyCode = item["AgencyCode"];
                        BranchCode = item["BranchCode"];
                        break;
                    }
                }
            }
            if (agencyStructure is JObject)
            {
                AgencyCode = agencyStructure["AgencyCode"];
                BranchCode = agencyStructure["BranchCode"];
            }
            ClientName = EpicClient["AccountName"];
            LookupCode = EpicClient["ClientLookupCode"];
            var items = EpicClient["ServicingContacts"]?["ServicingRoleItem"];

            string employeeCode = "";


            if (items is not null)
            {
                foreach (var item in items)
                {
                    if ((string?)item["Code"] == "CSR")
                    {
                        employeeCode = item["EmployeeLookupCode"].ToString() ?? "";
                        CSRLookupCode = employeeCode;
                        break;
                    }
                }
            }
        }
        public static async Task<AppliedGetClientRequest> Create(string _lookupCode, Vendor vendor, GlobalLog log )
        {
            var client = await AppliedGetClientRequest.CreateClientFromEpic(_lookupCode, vendor, false);
            if( client == null)
            {
                client = await AppliedGetClientRequest.CreateClientFromEpic(_lookupCode, vendor, true);
            }
            if (client == null)
            {
                Console.WriteLine($"No client found in Applied Epic for lookup code: {_lookupCode}.");
                return null;
            }
            else
            {
                Console.WriteLine($"Client found in Applied Epic for lookup code {client.LookupCode}. Client is {client.ClientName}.");
                log.AccountID = client.LookupCode;
                log.AccountName = client.ClientName;
            }
            return client;

        }
        public string LookupCode { get; set;  }
        public string BranchCode { get; set; }
        public string AgencyCode { get; set; }
        public string ClientName { get; set; }
        public int ClientID { get; set; }
        public string EmailAddress { get; set; }
        public string CSRLookupCode { get; set; }
        private static string _url = "https://api.myappliedproducts.com/sdk/v1/clients";
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
        public async Task<HttpResponseMessage> GetFromAppliedWithName(Vendor vendor)
        {
            var queryParams = new Dictionary<string, string> 
            { 
                {"ClientName", LookupCode }, 
                {"IncludeActive", "True" }, 
                {"IncludeInactive", "False" } 
           };
            return await AppliedApiClient.GetObject(_url,queryParams, vendor );           
        }

        public static async Task<HttpResponseMessage> GetFromAppledWithID(Vendor vendor,  int id)
        {
            return await AppliedApiClient.GetObject($"{_url}/{id}", new Dictionary<string, string>(), vendor);
        }

        public static async Task<AppliedGetClientRequest> CreateFromID(int id, Vendor vendor)
        {

            var response = await AppliedGetClientRequest.GetFromAppledWithID(vendor, id);
            return await CreateClientFromEpicResponse(response, vendor);
        }

        public static async Task<AppliedGetClientRequest> CreateClientViaScrape(string lookupCode, Vendor vendor)
        {
            var body = new 
            {
                accountInput = lookupCode,
                username = vendor.EpicUserName,
                password = vendor.EpicPassword,

                ByName = false,
               
                enterpriseId = vendor.EpicSubdomain
            };
            var response = await ApiClient.CallApiAsync($"http://api.instechpay.co/get-client", HttpMethod.Get, new Dictionary<string, string>(), body, null, new Dictionary<string, string>());
            var responseString = await response.Content.ReadAsStringAsync();
            var client = JsonConvert.DeserializeObject<dynamic>(responseString);
            if (client == null)
            {

                 body = new
                {
                    accountInput = lookupCode,
                    username = vendor.EpicUserName,
                     password = vendor.EpicPassword,
                     ByName = true,
                    enterpriseId = vendor.EpicSubdomain
                };
                response = await ApiClient.CallApiAsync($"http://api.instechpay.co/get-client", HttpMethod.Get, new Dictionary<string, string>(), null, null, new Dictionary<string, string>());
                responseString = await response.Content.ReadAsStringAsync();

            }
            AppliedGetClientRequest appliedApiClient = new AppliedGetClientRequest(client["lookupCode"]);
            appliedApiClient.ClientName = client["accountName"];
            return appliedApiClient; 

        }

    }
}
