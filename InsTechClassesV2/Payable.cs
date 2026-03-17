using Amazon.DynamoDBv2.Model;
using AmazonUtilities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
    public class Payable
    {
        public string Id { get; set; }
        public decimal Amount { get; set; }
        public string InvoiceId { get; set; }
        public string PolicyId { get; set; }
        public string PaymentRefNum { get; set; }
        public string DateCreated { get; set; }

        // Vendor fields — denormalized on the payable
        public string CustomerVendorId { get; set; }
        public string VendorName { get; set; }
        public string PaymentAccountNumber { get; set; }
        public string PaymentRoutingNumber { get; set; }
        public string VendorAddress { get; set; }
        public string VendorNotes { get; set; }

        public static async Task<List<Payable>> GetListFromDb(string vendorId)
        {
            var result = await DynamoDatabaseTransactions.GetAllItemsByEntity(vendorId, "Payable");
            var list = new List<Payable>();
            foreach (var item in result)
                list.Add(MapFromDynamoItem(item));
            return list;
        }

        public async Task InsertIntoDynamo(string vendorId)
        {
            var newId = Guid.NewGuid().ToString("N")[..12];
            DateCreated = DateTime.UtcNow.ToString("o");
            var item = ToDynamoItem();
            await DynamoDatabaseTransactions.InsertItemAsync(vendorId, item, newId, "Payable");
            Id = newId;
        }

        public async Task UpdateDynamoAsync(string vendorId)
        {
            var item = ToDynamoItem();
            await DynamoDatabaseTransactions.UpdateItemAsync(vendorId, item, Id.Replace("Payable#", ""), "Payable");
        }

        private Dictionary<string, AttributeValue> ToDynamoItem()
        {
            var d = new Dictionary<string, AttributeValue>();

            void S(string key, string val)
            {
                if (!string.IsNullOrWhiteSpace(val))
                    d[key] = new AttributeValue { S = val };
            }

            d["Amount"] = new AttributeValue { N = Amount.ToString() };
            S("InvoiceId", InvoiceId);
            S("PolicyId", PolicyId);
            S("PaymentRefNum", PaymentRefNum);
            S("DateCreated", DateCreated);
            S("CustomerVendorId", CustomerVendorId);
            S("VendorName", VendorName);
            S("PaymentAccountNumber", PaymentAccountNumber);
            S("PaymentRoutingNumber", PaymentRoutingNumber);
            S("VendorAddress", VendorAddress);
            S("VendorNotes", VendorNotes);

            return d;
        }

        private static Payable MapFromDynamoItem(Dictionary<string, AttributeValue> item)
        {
            string G(string key) => item.ContainsKey(key) ? item[key].S : "";

            return new Payable
            {
                Id = G("SK"),
                Amount = item.ContainsKey("Amount") && !string.IsNullOrEmpty(item["Amount"].N)
                    ? decimal.Parse(item["Amount"].N) : 0,
                InvoiceId = G("InvoiceId"),
                PolicyId = G("PolicyId"),
                PaymentRefNum = G("PaymentRefNum"),
                DateCreated = G("DateCreated"),
                CustomerVendorId = G("CustomerVendorId"),
                VendorName = G("VendorName"),
                PaymentAccountNumber = G("PaymentAccountNumber"),
                PaymentRoutingNumber = G("PaymentRoutingNumber"),
                VendorAddress = G("VendorAddress"),
                VendorNotes = G("VendorNotes"),
            };
        }
    }
}
