using Amazon.DynamoDBv2.Model;
using AmazonUtilities.DynamoDatabase;
using Newtonsoft.Json;
using AmazonUtilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
    public class InvoiceLineItem
    {
        public string Id { get; set; }
        public string Type { get; set; }        // premium, tax, fee
        public string Description { get; set; }
        public decimal Amount { get; set; }
    }

    public class FinanceQuote
    {
        public string Company { get; set; }
        public decimal DownPaymentPercent { get; set; }
        public decimal DownPaymentAmount { get; set; }
        public decimal AmountFinanced { get; set; }
        public decimal MonthlyPayment { get; set; }
        public decimal APR { get; set; }
        public int Term { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class Invoice
    {
        public string Id { get; set; }
        public string Status { get; set; } = "draft";   // draft, sent, paid
        public string DateCreated { get; set; }
        public string DateUpdated { get; set; }

        // Policy association
        public string PolicyId { get; set; }            // null if manual entry
        public string PolicyNumber { get; set; }
        public string InsuredName { get; set; }
        public string InsuredEmail { get; set; }
        public string CarrierName { get; set; }
        public string PolicyStartDate { get; set; }
        public string PolicyEndDate { get; set; }
        public string PolicyDescription { get; set; }

        // Line items
        public List<InvoiceLineItem> LineItems { get; set; } = new();
        public bool ShowLineItems { get; set; } = true;

        // Finance
        public FinanceQuote AttachedFinanceQuote { get; set; }

        public static async Task<List<Invoice>> GetListAsync(string vendorId)
        {
            var result = await DynamoDatabaseTransactions.GetAllItemsByEntity(vendorId, "Invoice");
            return result.Select(MapFromDynamo).Where(x => x != null).ToList();
        }

        public static async Task<Invoice?> GetByIdAsync(string vendorId, string invoiceId)
        {
            var item = await DynamoDatabaseTransactions.GetItemByIdAsync(vendorId, invoiceId, "Invoice");
            return (item == null || item.Count == 0) ? null : MapFromDynamo(item);
        }

        public async Task InsertAsync(int vendorId)
        {
            DateCreated = DateTime.UtcNow.ToString("o");
            DateUpdated = DateCreated;
            var item = ToDynamoItem();
            var newId = await WireRefNumGenerator.GenerateRefNumberAsync();
            await DynamoDatabaseTransactions.InsertItemAsync(vendorId.ToString(), item, newId, "Invoice");
            Id = newId;
        }

        public async Task UpdateAsync(string vendorId)
        {
            DateUpdated = DateTime.UtcNow.ToString("o");
            var item = ToDynamoItem();
            await DynamoDatabaseTransactions.UpdateItemAsync(vendorId, item, Id.Replace("Invoice#", ""), "Invoice");
        }

        private Dictionary<string, AttributeValue> ToDynamoItem()
        {
            var d = new Dictionary<string, AttributeValue>();

            void S(string k, string v) { if (!string.IsNullOrWhiteSpace(v)) d[k] = new AttributeValue { S = v }; }
            void B(string k, bool v) => d[k] = new AttributeValue { BOOL = v };

            S("Status", Status);
            S("DateCreated", DateCreated);
            S("DateUpdated", DateUpdated);
            S("PolicyId", PolicyId);
            S("PolicyNumber", PolicyNumber);
            S("InsuredName", InsuredName);
            S("InsuredEmail", InsuredEmail);
            S("CarrierName", CarrierName);
            S("PolicyStartDate", PolicyStartDate);
            S("PolicyEndDate", PolicyEndDate);
            S("PolicyDescription", PolicyDescription);
            B("ShowLineItems", ShowLineItems);

            if (LineItems?.Count > 0)
                S("LineItems", JsonConvert.SerializeObject(LineItems));

            if (AttachedFinanceQuote != null)
                S("AttachedFinanceQuote", JsonConvert.SerializeObject(AttachedFinanceQuote));

            return d;
        }

        private static Invoice MapFromDynamo(Dictionary<string, AttributeValue> item)
        {
            if (item == null || item.Count == 0) return null;

            string G(string k) => item.ContainsKey(k) ? item[k].S : "";
            bool Gb(string k) => item.ContainsKey(k) && (item[k].BOOL ?? false);

            List<InvoiceLineItem> ParseItems(string json)
            {
                if (string.IsNullOrWhiteSpace(json)) return new();
                try { return JsonConvert.DeserializeObject<List<InvoiceLineItem>>(json) ?? new(); }
                catch { return new(); }
            }

            FinanceQuote ParseQuote(string json)
            {
                if (string.IsNullOrWhiteSpace(json)) return null;
                try { return JsonConvert.DeserializeObject<FinanceQuote>(json); }
                catch { return null; }
            }

            return new Invoice
            {
                Id = G("SK"),
                Status = G("Status"),
                DateCreated = G("DateCreated"),
                DateUpdated = G("DateUpdated"),
                PolicyId = G("PolicyId"),
                PolicyNumber = G("PolicyNumber"),
                InsuredName = G("InsuredName"),
                InsuredEmail = G("InsuredEmail"),
                CarrierName = G("CarrierName"),
                PolicyStartDate = G("PolicyStartDate"),
                PolicyEndDate = G("PolicyEndDate"),
                PolicyDescription = G("PolicyDescription"),
                ShowLineItems = Gb("ShowLineItems"),
                LineItems = ParseItems(G("LineItems")),
                AttachedFinanceQuote = ParseQuote(G("AttachedFinanceQuote")),
            };
        }
    }
}
