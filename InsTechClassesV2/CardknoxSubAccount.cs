using Amazon.DynamoDBv2.Model;
using AmazonUtilities;

namespace InsTechClassesV2
{
    public class CardknoxSubAccount
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string CardknoxApiKeySecretName { get; set; }
        public static async Task<List<CardknoxSubAccount>> GetListAsync(int vendorId)
        {
            var items = await DynamoDatabaseTransactions.GetAllItemsByEntity(vendorId.ToString(), "SubAccount");
            return items.Select(item => new CardknoxSubAccount
            {
                Id = item.ContainsKey("SubAccountId") ? item["SubAccountId"].S : "",
                Name = item.ContainsKey("Name") ? item["Name"].S : "",
                CardknoxApiKeySecretName = item.ContainsKey("CardknoxApiKeySecretName") ? item["CardknoxApiKeySecretName"].S : "",
            }).ToList();
        }

        public async Task SaveAsync(int vendorId)
        {
            if (string.IsNullOrEmpty(Id))
                Id = Guid.NewGuid().ToString("N");

            var item = new Dictionary<string, AttributeValue>
            {
                { "EntityType", new AttributeValue { S = "SubAccount" } },
                { "SubAccountId", new AttributeValue { S = Id } },
                { "Name", new AttributeValue { S = Name ?? "" } },
                { "CardknoxApiKeySecretName", new AttributeValue { S = CardknoxApiKeySecretName ?? "" } }
            };

            var existing = await DynamoDatabaseTransactions.GetItemByIdAsync(vendorId.ToString(), Id, "SubAccount");
            if (existing == null || existing.Count == 0)
                await DynamoDatabaseTransactions.InsertItemAsync(vendorId.ToString(), item, Id, "SubAccount");
            else
                await DynamoDatabaseTransactions.UpdateItemAsync(vendorId.ToString(), item, Id, "SubAccount");
        }
    }
}
