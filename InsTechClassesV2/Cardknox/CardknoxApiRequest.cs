using AmazonUtilities;
using InsTechClassesV2.Api;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.Cardknox
{
    public abstract class CardknoxApiRequest
    {
        public async Task<HttpResponseMessage> PostToCardknox(Vendor vendor)
        {
            this.xKey = await SecretManager.GetSecret(vendor.CardknoxApiKeySecretName);
            //if (vendor.IsInstructional) this.xKey = "ifmerchatest3f02d6c3925944798466adca90a4c77d";
            var response = await ApiClient.CallApiAsync($"https://x1.cardknox.com/{path}", HttpMethod.Post, new Dictionary<string, string>(), this, null, new Dictionary<string, string>());
            return response;
        }
        public string xKey { get; set; }
        public string xSoftwareName { get; set; } = "Insure-Tech";
        public string xSoftwareVersion { get; set; } = "1.0.0.0";
        public string xVersion { get; set; } = "5.0.0";

        protected abstract string path { get; set; }

        public  abstract string   xCommand { get; set; }
        public async Task <CardknoxResponse> SendRequest(Vendor vendor)
        {
            var cardknoxRawRespone = await this.PostToCardknox(vendor);
            var cardknoxResponseString = await cardknoxRawRespone.Content.ReadAsStringAsync();
            return  JsonConvert.DeserializeObject<CardknoxResponse>(cardknoxResponseString);
           
        }
        public async Task<string> GetToken(Vendor vendor)
        {

           var cardknoxResponse = await SendRequest(vendor);
            if (cardknoxResponse?.xResult == "E") throw new Exception($"Error saving payment data {cardknoxResponse.xError}");
            var token = cardknoxResponse?.xToken ?? "";
            return token;

        }

    }
    
}
