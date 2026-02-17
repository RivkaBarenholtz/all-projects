using AmazonUtilities.DynamoDatabase;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
   public class SSOLogin
    {
        public string IdToken { get; set; }
        public string RefreshToken { get; set; }
        public string Code { get; set; }

        public string Subdomain { get; set; }
        public string VendorId { get; set; }
        public async Task<string> EnterIntoDynamo()
        {
           var guid = Guid.NewGuid();
            Code = guid.ToString();
            var vendor = await Utilities.GetVendor(Subdomain);
            int vendorid = vendor.Id; 
           await  SSO_Login.PutItemAsync(Code, IdToken, RefreshToken, vendorid);
            return Code;
        }

        public async Task GetFromDynamo()
        {
            var dynamoItem = await SSO_Login.GetItemByIdAsync(Code);

            var expiresAt = long.Parse(dynamoItem.TryGetValue("ExpiresAt", out var exp) ? exp.N : "-1");

            await SSO_Login.DeleteItemAsync(Code);
            if (expiresAt < DateTimeOffset.UtcNow.ToUnixTimeSeconds())
            {
                return; 
            }
            IdToken = dynamoItem.TryGetValue("IdToken", out var idToken)?idToken.S:"";
            RefreshToken = dynamoItem.TryGetValue("RefreshToken", out var refresh)?refresh.S:"";
            VendorId = dynamoItem.TryGetValue("VendorId", out var vend)?vend.N:"";

            
        }

    }

    
}
