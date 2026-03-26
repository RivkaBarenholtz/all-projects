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
        public string CsrCode { get; set; }
        public string CsrEmail { get; set; }
        public string SubAccountId { get; set; }

        public static async Task<CsrSubAccountMapping> GetByCsrCode(int vendorId, string csrCode)
        {
            var item = await DynamoDatabaseTransactions.GetItemByIdAsync(vendorId.ToString(), csrCode, "CsrMapping");
            if (item == null || item.Count == 0) return null;

            return new CsrSubAccountMapping
            {
                CsrCode = item.ContainsKey("CsrCode") ? item["CsrCode"].S : csrCode,
                CsrEmail = item.ContainsKey("CsrEmail") ? item["CsrEmail"].S : "",
                SubAccountId = item.ContainsKey("SubAccountId") ? item["SubAccountId"].S : ""
            };
        }

        public async Task Save(int vendorId)
        {
            var item = new Dictionary<string, AttributeValue>
            {
                { "EntityType", new AttributeValue { S = "CsrMapping" } }
            };
            if (!string.IsNullOrEmpty(CsrCode)) item["CsrCode"] = new AttributeValue { S = CsrCode };
            if (!string.IsNullOrEmpty(CsrEmail)) item["CsrEmail"] = new AttributeValue { S = CsrEmail };
            if (!string.IsNullOrEmpty(SubAccountId)) item["SubAccountId"] = new AttributeValue { S = SubAccountId };

            var existing = await DynamoDatabaseTransactions.GetItemByIdAsync(vendorId.ToString(), CsrCode, "CsrMapping");
            if (existing == null || existing.Count == 0)
                await DynamoDatabaseTransactions.InsertItemAsync(vendorId.ToString(), item, CsrCode, "CsrMapping");
            else
                await DynamoDatabaseTransactions.UpdateItemAsync(vendorId.ToString(), item, CsrCode, "CsrMapping");
        }
    }
}
