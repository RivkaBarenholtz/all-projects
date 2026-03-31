using Amazon.DynamoDBv2.Model;
using AmazonUtilities;
using AmazonUtilities.DynamoDatabase;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
    public class CsrSubAccountMapping
    {
        public string Id { get; set; }
        public string CsrCode { get; set; }
        public string CsrEmail { get; set; }
        public string SubAccountId { get; set; }

        public static async Task<List<CsrSubAccountMapping>> GetListAsync(int vendorId)
        {
            var items = await DynamoDatabaseTransactions.GetAllItemsByEntity(vendorId.ToString(), "CsrMapping");
            return items.Select(item => new CsrSubAccountMapping
            {
                Id = item.ContainsKey("Id") ? item["Id"].S : (item.ContainsKey("CsrCode") ? item["CsrCode"].S : ""),
                CsrCode = item.ContainsKey("CsrCode") ? item["CsrCode"].S : "",
                CsrEmail = item.ContainsKey("CsrEmail") ? item["CsrEmail"].S : "",
                SubAccountId = item.ContainsKey("SubAccountId") ? item["SubAccountId"].S : ""
            }).ToList();
        }

        public static async Task<CsrSubAccountMapping> GetByCsrCode(int vendorId, string csrCode)
        {
            var item = await DynamoDatabaseTransactions.GetItemByIdAsync(vendorId.ToString(), csrCode, "CsrMapping");
            if (item == null || item.Count == 0) return null;

            return new CsrSubAccountMapping
            {
                Id = item.ContainsKey("Id") ? item["Id"].S : csrCode,
                CsrCode = item.ContainsKey("CsrCode") ? item["CsrCode"].S : csrCode,
                CsrEmail = item.ContainsKey("CsrEmail") ? item["CsrEmail"].S : "",
                SubAccountId = item.ContainsKey("SubAccountId") ? item["SubAccountId"].S : ""
            };
        }

        public async Task Save(int vendorId)
        {
            if (string.IsNullOrEmpty(Id))
                Id = !string.IsNullOrEmpty(CsrCode) ? CsrCode : Guid.NewGuid().ToString("N");

            var item = new Dictionary<string, AttributeValue>
            {
                { "EntityType", new AttributeValue { S = "CsrMapping" } },
                { "Id", new AttributeValue { S = Id } }
            };
            if (!string.IsNullOrEmpty(CsrCode)) item["CsrCode"] = new AttributeValue { S = CsrCode };
            if (!string.IsNullOrEmpty(CsrEmail)) item["CsrEmail"] = new AttributeValue { S = CsrEmail };
            if (!string.IsNullOrEmpty(SubAccountId)) item["SubAccountId"] = new AttributeValue { S = SubAccountId };

            var existing = await DynamoDatabaseTransactions.GetItemByIdAsync(vendorId.ToString(), Id, "CsrMapping");
            if (existing == null || existing.Count == 0)
                await DynamoDatabaseTransactions.InsertItemAsync(vendorId.ToString(), item, Id, "CsrMapping");
            else
                await DynamoDatabaseTransactions.UpdateItemAsync(vendorId.ToString(), item, Id, "CsrMapping");
        }

        public async Task Delete(int vendorId)
        {
            await DynamoDatabaseTransactions.DeleteItemAsync(vendorId.ToString(), Id, "CsrMapping");
        }
    }
}
