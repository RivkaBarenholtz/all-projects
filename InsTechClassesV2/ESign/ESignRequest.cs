using Amazon.DynamoDBv2.Model;
using AmazonUtilities;
using AmazonUtilities.DynamoDatabase;
using Newtonsoft.Json;
using System.Security.Cryptography;

namespace InsTechClassesV2.ESign
{
    public class ESignParty
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Email { get; set; } = "";
        public string Name { get; set; } = "";
        public string Role { get; set; } = "Insured"; // Insured | Agent | Broker
        public int Order { get; set; } = 1;
        public string Token { get; set; } = Guid.NewGuid().ToString("N");
        public string Status { get; set; } = "Pending"; // Pending | Signed | Declined
        public string? SignedAt { get; set; }
        public string? IPAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? SignatureData { get; set; } // base64 PNG data URL
        public string? SignatureType { get; set; } // Drawn | Typed
    }

    public class ESignAuditEvent
    {
        public string EventType { get; set; } = ""; // Created|EmailSent|Viewed|ConsentShown|ConsentAgreed|FieldSigned|FieldDateConfirmed|Signed|Declined|Voided|Completed
        public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");
        public string? PartyId { get; set; }
        public string? IPAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? SignerName { get; set; }
        public string? SignerEmail { get; set; }
        public string? Metadata { get; set; }
    }

    public class ESignRequest
    {
        public string Id { get; set; } = "";
        public string VendorId { get; set; } = "";
        public string PolicyId { get; set; } = "";
        public string PolicyCode { get; set; } = "";
        public string Status { get; set; } = "Pending"; // Pending | Completed | Voided
        public string SignerName { get; set; } = "";
        public string SignerEmail { get; set; } = "";
        public string DocumentHash { get; set; } = ""; // SHA-256 of original PDF
        public string? SignedDocumentHash { get; set; } // SHA-256 of certificate PDF
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
        public string ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(30).ToString("o");
        public List<ESignParty> Parties { get; set; } = new();
        public List<ESignAuditEvent> AuditEvents { get; set; } = new();

        public static async Task<ESignRequest?> GetByIdAsync(string vendorId, string requestId)
        {
            var rawId = requestId.Replace("ESign#", "");
            var item = await DynamoDatabaseTransactions.GetItemByIdAsync(vendorId, rawId, "ESign");
            if (item == null || item.Count == 0) return null;
            return MapFromDynamo(item);
        }

        public static async Task<(ESignRequest? request, ESignParty? party)> GetByTokenAsync(string token)
        {
            var s3 = new AmzS3Bucket("insure-tech-esign-tokens", $"{token}.json");
            string? json;
            try { json = await s3.ReadS3File(); }
            catch { return (null, null); }

            if (string.IsNullOrEmpty(json)) return (null, null);

            dynamic? tokenData = JsonConvert.DeserializeObject<dynamic>(json);
            if (tokenData == null) return (null, null);

            string vendorId = tokenData["vendorId"]?.ToString() ?? "";
            string requestId = tokenData["requestId"]?.ToString() ?? "";
            string partyId = tokenData["partyId"]?.ToString() ?? "";

            var esignReq = await GetByIdAsync(vendorId, requestId);
            if (esignReq == null) return (null, null);

            var party = esignReq.Parties.FirstOrDefault(p => p.Id == partyId);
            return (esignReq, party);
        }

        public static async Task<List<ESignRequest>> GetByPolicyIdAsync(string vendorId, string policyId)
        {
            var all = await DynamoDatabaseTransactions.GetAllItemsByEntity(vendorId, "ESign");
            var result = new List<ESignRequest>();
            foreach (var item in all)
            {
                var req = MapFromDynamo(item);
                if (req != null && req.PolicyId == policyId)
                    result.Add(req);
            }
            return result;
        }

        public async Task SaveAsync()
        {
            var item = ToDynamoItem();
            if (string.IsNullOrEmpty(Id))
            {
                var newId = await WireRefNumGenerator.GenerateRefNumberAsync();
                await DynamoDatabaseTransactions.InsertItemAsync(VendorId, item, newId, "ESign");
                Id = newId;
            }
            else
            {
                await DynamoDatabaseTransactions.UpdateItemAsync(VendorId, item, Id.Replace("ESign#", ""), "ESign");
            }
        }

        public async Task SaveTokensToS3()
        {
            foreach (var party in Parties)
            {
                var tokenData = JsonConvert.SerializeObject(new
                {
                    vendorId = VendorId,
                    requestId = Id,
                    partyId = party.Id
                });
                var s3 = new AmzS3Bucket("insure-tech-esign-tokens", $"{party.Token}.json");
                await s3.UpdateFileContentAsync(tokenData);
            }
        }

        public static string ComputeHash(byte[] data)
        {
            using var sha256 = SHA256.Create();
            return BitConverter.ToString(sha256.ComputeHash(data)).Replace("-", "").ToLower();
        }

        private Dictionary<string, AttributeValue> ToDynamoItem()
        {
            return new Dictionary<string, AttributeValue>
            {
                ["PolicyId"] = new AttributeValue { S = PolicyId },
                ["PolicyCode"] = new AttributeValue { S = PolicyCode ?? "" },
                ["Status"] = new AttributeValue { S = Status },
                ["SignerName"] = new AttributeValue { S = SignerName },
                ["SignerEmail"] = new AttributeValue { S = SignerEmail },
                ["DocumentHash"] = new AttributeValue { S = DocumentHash ?? "" },
                ["SignedDocumentHash"] = new AttributeValue { S = SignedDocumentHash ?? "" },
                ["CreatedAt"] = new AttributeValue { S = CreatedAt },
                ["ExpiresAt"] = new AttributeValue { S = ExpiresAt },
                ["Parties"] = new AttributeValue { S = JsonConvert.SerializeObject(Parties) },
                ["AuditEvents"] = new AttributeValue { S = JsonConvert.SerializeObject(AuditEvents) }
            };
        }

        private static ESignRequest? MapFromDynamo(Dictionary<string, AttributeValue> item)
        {
            if (item == null || item.Count == 0) return null;
            return new ESignRequest
            {
                Id = item["SK"].S,
                VendorId = item["PK"].S.Replace("Vendor#", ""),
                PolicyId = item.ContainsKey("PolicyId") ? item["PolicyId"].S : "",
                PolicyCode = item.ContainsKey("PolicyCode") ? item["PolicyCode"].S : "",
                Status = item.ContainsKey("Status") ? item["Status"].S : "Pending",
                SignerName = item.ContainsKey("SignerName") ? item["SignerName"].S : "",
                SignerEmail = item.ContainsKey("SignerEmail") ? item["SignerEmail"].S : "",
                DocumentHash = item.ContainsKey("DocumentHash") ? item["DocumentHash"].S : "",
                SignedDocumentHash = item.ContainsKey("SignedDocumentHash") && !string.IsNullOrEmpty(item["SignedDocumentHash"].S)
                    ? item["SignedDocumentHash"].S : null,
                CreatedAt = item.ContainsKey("CreatedAt") ? item["CreatedAt"].S : "",
                ExpiresAt = item.ContainsKey("ExpiresAt") ? item["ExpiresAt"].S : "",
                Parties = item.ContainsKey("Parties")
                    ? JsonConvert.DeserializeObject<List<ESignParty>>(item["Parties"].S) ?? new()
                    : new(),
                AuditEvents = item.ContainsKey("AuditEvents")
                    ? JsonConvert.DeserializeObject<List<ESignAuditEvent>>(item["AuditEvents"].S) ?? new()
                    : new()
            };
        }
    }
}
