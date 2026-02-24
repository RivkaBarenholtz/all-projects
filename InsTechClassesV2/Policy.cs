using Amazon.DynamoDBv2.Model;
using AmazonUtilities;
using AmazonUtilities.DynamoDatabase;
using InsTechClassesV2.Cardknox;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;


using System.Threading.Tasks;

namespace InsTechClassesV2
{
  public class Policy
    {

        public CustomerFilters Customer { get; set; }
        public decimal Amount { get; set; }
        public string PolicyCode { get; set; }

        public string DateCreated { get; set; }
        public string PolicyDescription { get; set;  }
        public string SignPolicyLink { get; set;  }
        public string Id { get; set;  }

        public Boolean IsSignedAndPaid { get; set; } = false;

        public async static  Task <List<Policy>> GetListOfPoliciesFromDb (string vendorId)
        {
            List<Policy> policies = new();
            var result = await DynamoDatabaseTransactions.GetAllItemsByEntity(vendorId, "Policy");
            foreach (var item in result)
            {
                policies.Add(MapFromDynamoItem(item));
            }
            return policies;
        }

        public static async Task<Policy?> GetPolicyByIdAsync(string vendorId, string policyId)
        {
            var item = await DynamoDatabaseTransactions.GetItemByIdAsync(vendorId, policyId, "Policy");
           
            var policy =  MapFromDynamoItem(item);
            if(policy != null)
            {
                if(!policy.IsSignedAndPaid && string.IsNullOrEmpty(policy.SignPolicyLink))
                {
                    policy.SignPolicyLink = await BoldSignApi.BoldSignClient.GenerateBoldSignUrl(policy);
                }
                if (policy.IsSignedAndPaid)
                {
                    policy.SignPolicyLink = "";
                }
            }
            return policy;
        }

        private static Policy MapFromDynamoItem(Dictionary<string, AttributeValue> item)
        {
            if (item == null || item.Count == 0)
                return null;

            var policy = new Policy
            {
                Id = item["SK"].S, 
                Amount = item.ContainsKey("Amount") && !string.IsNullOrEmpty(item["Amount"].N)
                    ? decimal.Parse(item["Amount"].N)
                    : 0,

                PolicyCode = item.ContainsKey("PolicyCode") ? item["PolicyCode"].S : "",
                PolicyDescription = item.ContainsKey("PolicyDescription") ? item["PolicyDescription"].S : "",
                SignPolicyLink = item.ContainsKey("PayPolicyLink") ? item["PayPolicyLink"].S : "",
                IsSignedAndPaid = item.ContainsKey("IsSignedAndPaid") && (item["IsSignedAndPaid"].BOOL??false) ? true : false,

                Customer = new CustomerFilters
                {
                    CustomerId = item.ContainsKey("CardknoxCustomerId") ? item["CardknoxCustomerId"].S : "",
                    CustomerNumber = item.ContainsKey("CustomerNumber") ? item["CustomerNumber"].S : "",
                    BillPhoneNumber = item.ContainsKey("Phone") ? item["Phone"].S : "",
                    Email = item.ContainsKey("Email") ? item["Email"].S : "",
                    BillFirstName = item.ContainsKey("FirstName") ? item["FirstName"].S : "",
                    BillLastName = item.ContainsKey("LastName") ? item["LastName"].S : "",
                    BillMiddleName = item.ContainsKey("MiddleName") ? item["MiddleName"].S : "",
                    BillMobile = item.ContainsKey("Mobile") ? item["Mobile"].S : "",
                    BillStreet = item.ContainsKey("Address") ? item["Address"].S : "",
                    BillCity = item.ContainsKey("City") ? item["City"].S : "",
                    BillState = item.ContainsKey("State") ? item["State"].S : "",
                    BillZip = item.ContainsKey("Zip") ? item["Zip"].S : ""
                }
            };

            return policy;
        }
        public async Task InsertIntoDynamo(Vendor vendor)
        {
            var newItem = new Dictionary<string, AttributeValue>();

            void AddString(string key, string value)
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    newItem[key] = new AttributeValue { S = value };
                }
            }

            void AddNumber(string key, decimal? value)
            {
                if (value.HasValue)
                {
                    newItem[key] = new AttributeValue { N = value.Value.ToString() };
                }
            }

            // Policy fields
            AddNumber("Amount", Amount);
            AddString("PolicyCode", PolicyCode);
            AddString("PolicyDescription", PolicyDescription);

            // Customer fields (null-safe)
            if (Customer != null)
            {
                AddString("CardknoxCustomerId", Customer.CustomerId);
                AddString("CustomerNumber", Customer.CustomerNumber);
                AddString("Phone", Customer.BillPhoneNumber);
                AddString("Email", Customer.Email);
                AddString("FirstName", Customer.BillFirstName);
                AddString("LastName", Customer.BillLastName);
                AddString("MiddleName", Customer.BillMiddleName);
                AddString("Mobile", Customer.BillMobile);
                AddString("Address", Customer.BillStreet);
                AddString("City", Customer.BillCity);
                AddString("State", Customer.BillState);
                AddString("Zip", Customer.BillZip);
            }

            var newId = await WireRefNumGenerator.GenerateRefNumberAsync();
            

            newItem.Add("Date", new AttributeValue { S = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ssZ") });

            await DynamoDatabaseTransactions.InsertItemAsync(
                vendor.Id.ToString(),
                newItem,
                newId,
                "Policy");

            Id = newId;
        }
    }
}
