using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using System;
using System.Threading.Tasks;


namespace AmazonUtilities.DynamoDatabase


{
    public class WireRefNumGenerator
    {

        private static readonly IAmazonDynamoDB _dynamoDb = new AmazonDynamoDBClient();
        private const string TableName = "WireCounters";
        private const string CounterName = "WireRef";

       
        public static async Task<string> GenerateRefNumberAsync()
        {
            // Increment and get the next counter value atomically
            var request = new UpdateItemRequest
            {
                TableName = TableName,
                Key = new Dictionary<string, AttributeValue>
            {
                { "WireRef", new AttributeValue { S = CounterName } }
            },
                UpdateExpression = "SET NextValue = if_not_exists(NextValue, :start) + :inc",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                { ":start", new AttributeValue { N = "0" } },
                { ":inc", new AttributeValue { N = "1" } }
            },
                ReturnValues = "UPDATED_NEW"
            };

            var response = await _dynamoDb.UpdateItemAsync(request);
            var counterValue = int.Parse(response.Attributes["NextValue"].N);

            // Format your reference number, e.g., T000001REF
            return $"REFWR{counterValue:D9}";
        }
    }

}

