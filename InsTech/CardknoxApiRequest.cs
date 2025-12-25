using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;

namespace InsTech
{
    public abstract class CardknoxApiRequest
    {
        public  async Task<HttpResponseMessage> PostToCardknox()
        {
            var response = await ApiClient.CallApiAsync("https://x1.cardknox.com/reportjson", HttpMethod.Post, new Dictionary<string, string>(), this, null, new Dictionary<string, string>());
            return response;
        }
       public  string xKey { get; set; } = "insuretechdev55876a81c3b2482eb8715f7e8bf839ab";
        public  string xSoftwareName { get; set; } = "Insure-Tech";
        public  string xSoftwareVersion { get; set; } = "1.0.0.0";
        public  string xVersion { get; set; } = "5.0.0";
        public  abstract string   xCommand { get; set; }
    }
}
