using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AmazonUtilities.DynamoDatabase
{
    public class DynamoDatabaseUsers
    {
        private static readonly string tableName = "UserData";
        private static readonly AmazonDynamoDBClient client = new AmazonDynamoDBClient();

        public static async Task PutItemAsync(string username, int VendorId, string Role, string Name)
        {
            string pk = username;
            var item = new Dictionary<string, AttributeValue>()
            {
                { "PK", new AttributeValue { S = pk } },
                { "Vendors", new AttributeValue { NS = new List<string> { VendorId.ToString() } } },
                { "Role", new AttributeValue { S = Role } },
                { "FullName", new AttributeValue { S = Name } }

            };
            // Add other attributes to the item

            var request = new PutItemRequest
            {
                TableName = tableName,
                Item = item
            };
            await client.PutItemAsync(request);
        }
        public static async Task UpdateItemVendorsAsync(string username, List<string> vendors)
        {
            string pk = username;
            var request = new UpdateItemRequest
            {
                TableName = tableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    { "PK", new AttributeValue { S = pk } }
                },
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                    { "#V", "VendorId" }
                },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    { ":newVendorId", new AttributeValue { NS = vendors } }
                },
                UpdateExpression = "SET #V = :newVendorId"
            };
            await client.UpdateItemAsync(request);
        }

        public static async Task  UpdateItemRoleAsync(string username, string newRole)
        {
            string pk = username;
            var request = new UpdateItemRequest
            {
                TableName = tableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    { "PK", new AttributeValue { S = pk } }
                },
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                    { "#R", "Role" }
                },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    { ":newRole", new AttributeValue { S = newRole } }
                },
                UpdateExpression = "SET #R = :newRole"
            };
            await client.UpdateItemAsync(request);
        }


    public static async Task<List<Dictionary<string, AttributeValue>>> FullTableScan()
    {
      
        var request = new ScanRequest
        {
            TableName = tableName
        };

        var results = new List<Dictionary<string, AttributeValue>>();
        ScanResponse response;

        do
        {
            response = await client.ScanAsync(request);
            results.AddRange(response.Items);

            // For pagination
            request.ExclusiveStartKey = response.LastEvaluatedKey;

        } while (response.LastEvaluatedKey != null && response.LastEvaluatedKey.Count > 0);

        return results;
    }

    public static async Task<Dictionary<string, AttributeValue>?> GetItemByIdAsync(string username)
        {
            string pk = username;

            var request = new GetItemRequest
            {
                TableName = tableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    { "PK", new AttributeValue { S = pk } }
                }
            };
            var response = await client.GetItemAsync(request);
            return response?.Item;
        }
    }
}
