using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace InsTech
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

        public static string GetSubdomain(string host)
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
                        if (childObject.Count == 1 && childObject["nil"]?.ToObject<bool>() == true )
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

    }

}
