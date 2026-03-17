using Amazon.DynamoDBv2.Model;
using AmazonUtilities;
using AmazonUtilities.DynamoDatabase;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
    public class CustomerVendor
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string PaymentAccountNumber { get; set; }
        public string PaymentRoutingNumber { get; set; }
        public string Address { get; set; }
        public string Notes { get; set; }

        public static async Task<List<CustomerVendor>> GetListFromDb(string vendorId)
        {
            var result = await DynamoDatabaseTransactions.GetAllItemsByEntity(vendorId, "CustomerVendor");
            var list = new List<CustomerVendor>();
            foreach (var item in result)
                list.Add(MapFromDynamoItem(item));
            return list;
        }

        public static async Task<CustomerVendor?> GetByNameAsync(string name)
        {
            var expressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                { ":index1", new AttributeValue { S = name } }
            };
            var result = await DynamoDatabaseTransactions.QueryTableUsingIndexAsync("Index1 = :index1", expressionAttributeValues, "Index-1");
            // Filter to CustomerVendor items only (Index-1 is shared across entity types)
            var match = result.FirstOrDefault(item => item.ContainsKey("SK") && item["SK"].S.StartsWith("CustomerVendor#"));
            return match != null ? MapFromDynamoItem(match) : null;
        }

        public async Task InsertIntoDynamo(string vendorId)
        {
            var newId = Guid.NewGuid().ToString("N")[..12];
            var item = ToDynamoItem();
            await DynamoDatabaseTransactions.InsertItemAsync(vendorId, item, newId, "CustomerVendor");
            Id = newId;
        }

        public async Task UpdateDynamoAsync(string vendorId)
        {
            var item = ToDynamoItem();
            await DynamoDatabaseTransactions.UpdateItemAsync(vendorId, item, Id.Replace("CustomerVendor#", ""), "CustomerVendor");
        }

        private Dictionary<string, AttributeValue> ToDynamoItem()
        {
            var d = new Dictionary<string, AttributeValue>();

            void S(string key, string val)
            {
                if (!string.IsNullOrWhiteSpace(val))
                    d[key] = new AttributeValue { S = val };
            }

            S("Name", Name);
            S("Index1", Name);  // enables lookup by name via Index-1 GSI
            S("PaymentAccountNumber", PaymentAccountNumber);
            S("PaymentRoutingNumber", PaymentRoutingNumber);
            S("Address", Address);
            S("Notes", Notes);

            return d;
        }

        private static CustomerVendor MapFromDynamoItem(Dictionary<string, AttributeValue> item)
        {
            string G(string key) => item.ContainsKey(key) ? item[key].S : "";

            return new CustomerVendor
            {
                Id = G("SK"),
                Name = G("Name"),
                PaymentAccountNumber = G("PaymentAccountNumber"),
                PaymentRoutingNumber = G("PaymentRoutingNumber"),
                Address = G("Address"),
                Notes = G("Notes"),
            };
        }
    }
}
