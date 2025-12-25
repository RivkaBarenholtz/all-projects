using Amazon.SecretsManager.Model.Internal.MarshallTransformations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.Cardknox
{
    public class CardknoxTransactionReportApiRequest:CardknoxApiRequest
    {
        
        public async Task<CardknoxTransactionReportResponse> GetCardknoxTransactionReportResponse(Vendor vendor)
        {
            var response = await base.PostToCardknox(vendor) ;
            string json = await response.Content.ReadAsStringAsync();
            return Newtonsoft.Json.JsonConvert.DeserializeObject<CardknoxTransactionReportResponse>(json)??new CardknoxTransactionReportResponse();

        }
        public CardknoxTransactionReportApiRequest( string refnum, string key)
        {
            xKey = key;
            xRefnum = refnum;
        }
       public override string xCommand { get; set; }= "Report:Transaction";
        protected override string path { get; set; }= "reportjson";
       public string xRefnum { get; set; }
    }
}
