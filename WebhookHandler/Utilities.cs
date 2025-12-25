using Amazon.S3.Model;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using AmazonUtilities;
using Amazon.DynamoDBv2.Model;

namespace InsTechClassesV2
{
    public static class Utilities
    {
        public static bool IsValidEmail(string email)
        {
            try
            {
                var addr = new MailAddress(email);
                return addr.Address == email; // Ensures valid format
            }
            catch
            {
                return false;
            }
        }
        public async static Task<Vendor?> GetVendor(string host)
        {
            var subdomain = GetSubdomain(host);
            var vendors = await GetVendorListAsync();
            return vendors?.FirstOrDefault(v => v.subdomain == subdomain);
            
        }
        public async static Task<Vendor?> GetVendorByID(int vendorID)
        {
            
            var vendors = await GetVendorListAsync();
            return vendors?.FirstOrDefault(v => v.Id == vendorID);


        }

        public async static Task <List<Vendor>> GetUserVendorsAsync(User user)
        {
            var vendorList = await GetVendorListAsync();
            return vendorList.Where(v => user.Vendors.Contains(v.Id.ToString())).ToList(); 
        }

        public async static Task<List<Vendor>?> GetVendorListAsync()
        {
            var s3 = new AmzS3Bucket("insure-tech-vendor-data", "VendorData.json");
            string? vendorData = await s3.ReadS3File();
            List<Vendor>? vendors = JsonConvert.DeserializeObject<List<Vendor>>(vendorData);
            return vendors;

        }

        private static string GetSubdomain(string host)
        {
            var parts = host.Split('.');

            // Assuming the structure is subdomain.domain.tld (e.g., sub.example.com)
            if (parts.Length >= 3)
            {
                return parts[0]; // The subdomain part
            }

            return "";
        }
        public static string RemoveNilProperties(string json)
        {
            JObject jsonObject = JObject.Parse(json);
            RemoveNilRecursive(jsonObject);
            return jsonObject.ToString();
        }
        private static void RemoveNilRecursive(JToken token)
        {
            if (token.Type == JTokenType.Object)
            {
                var propertiesToRemove = new List<JProperty>();

                foreach (var property in ((JObject)token).Properties())
                {
                    if (property.Value.Type == JTokenType.Object)
                    {
                        JObject childObject = (JObject)property.Value;

                        // If the object contains only "nil": true, mark it for removal
                        if (childObject.Count == 1 && childObject["nil"]?.ToObject<bool>() == true)
                        {
                            propertiesToRemove.Add(property);
                        }
                        else
                        {
                            RemoveNilRecursive(property.Value);
                        }
                    }
                    else if (property.Value.Type == JTokenType.Array)
                    {
                        RemoveNilRecursive(property.Value);
                    }
                }
                foreach (var propertyToRemove in propertiesToRemove)
                {
                    propertyToRemove.Remove();
                }
            }
            else if (token.Type == JTokenType.Array)
            {
                var array = (JArray)token;
                for (int i = array.Count - 1; i >= 0; i--)
                {
                    RemoveNilRecursive(array[i]);
                }
            }

        }

        public static string ConvertToCsv(List<Dictionary<string, AttributeValue>> items)
        {
            if (items.Count == 0)
                return "No transactions found.";

            var allKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var item in items)
                foreach (var key in item.Keys)
                    allKeys.Add(key);

            var sb = new StringBuilder();

            // CSV header
            sb.AppendLine(string.Join(",", allKeys));

            // Rows
            foreach (var item in items)
            {
                var row = new List<string>();
                foreach (var key in allKeys)
                {
                    item.TryGetValue(key, out var value);
                    string val = value switch
                    {
                        { S: not null } => value.S,
                        { N: not null } => value.N,
                        { BOOL: not null } => value.BOOL.ToString(),
                        _ => ""
                    };
                    row.Add($"\"{val.Replace("\"", "\"\"")}\""); // escape quotes
                }
                sb.AppendLine(string.Join(",", row));
            }

            return sb.ToString();
        }
    }
}
