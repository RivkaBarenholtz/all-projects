using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AmazonUtilities.DynamoDatabase
{
   public  class SSO_Login
    {
        private static readonly string tableName = "SSOLogin";
        private static readonly AmazonDynamoDBClient client = new AmazonDynamoDBClient();
        public static async Task PutItemAsync(string Code   , string IdToken, string RefreshToken,int vendorId)
        {
            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(2).ToUnixTimeSeconds();

            var item = new Dictionary<string, AttributeValue>()
            {
                { "Code", new AttributeValue { S = Code } },
                { "IdToken", new AttributeValue {S = IdToken } },
                { "RefreshToken", new AttributeValue { S = RefreshToken } },
                { "ExpiresAt", new AttributeValue { N = expiresAt.ToString() } },
                {"VendorId" , new AttributeValue{N= vendorId.ToString() } }
              
            };
            // Add other attributes to the item

            var request = new PutItemRequest
            {
                TableName = tableName,
                Item = item
            };
            await client.PutItemAsync(request);
        }


        public static async Task<Dictionary<string, AttributeValue>?> GetItemByIdAsync(string code)
        {
            

            var request = new GetItemRequest
            {
                TableName = tableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    { "Code", new AttributeValue { S = code } }
                }
            };
            var response = await client.GetItemAsync(request);
            return response?.Item;
        } 
        public static async Task DeleteItemAsync(string code)
        {
            

            var request = new DeleteItemRequest
            {
                TableName = tableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    { "Code", new AttributeValue { S = code } }
                }
            };
            await client.DeleteItemAsync(request); 
           
        }
    }
}

