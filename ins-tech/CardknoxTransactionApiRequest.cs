using Amazon.SecretsManager.Model.Internal.MarshallTransformations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ins_tech
{
    public class CardknoxTransactionApiRequest:CardknoxApiRequest
    {
        public async Task<CardknoxTransactionReportResponse> GetCardknoxTransactionReportResponse()
        {
            var response = await base.PostToCardknox() ;
            string json = await response.Content.ReadAsStringAsync();
            return Newtonsoft.Json.JsonConvert.DeserializeObject<CardknoxTransactionReportResponse>(json)??new CardknoxTransactionReportResponse();

        }
        public CardknoxTransactionApiRequest( string refnum)
        {
            xRefnum = refnum;
        }
       public override string xCommand { get; set; }= "Report:Transaction";
       public string xRefnum { get; set; }
    }
}
