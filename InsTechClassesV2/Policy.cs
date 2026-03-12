using Amazon.DynamoDBv2.Model;
using AmazonUtilities;
using AmazonUtilities.DynamoDatabase;
using InsTechClassesV2.Cardknox;
using BoldSign.Api;
using BoldSign.Model;
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
        public decimal SubBrokerAmount { get; set; }
        public decimal PaidByCustomer { get; set; }
        public decimal PaidToCarrier { get; set; }
                        
        public string SubBrokerName { get; set; }
        
        public string  CarrierName { get; set; }
        public DateTime? PolicyStartDate { get; set; }
        public DateTime? PolicyEndDate { get; set; }
        public string VendorId { get; set;  }
        public decimal Amount { get; set; }
        public decimal CommissionAmount { get; set; }
        public string PolicyCode { get; set; }
        public string DateCreated { get; set; }
        public string PolicyDescription { get; set;  }
        public string SignPolicyLink { get; set;  }
        public string QuoteFileName { get; set; }
        public string DocumentId { get; set; }

        public string Id { get; set;  }
        public Boolean IsSigned { get; set; } = false;
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
        public static async Task<Policy?> GetPolicyByDocumentIdAsync(string documentid)
        {
            var expressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                {":index1", new AttributeValue { S = documentid}}
            };
            string keyExpression = "Index1 = :index1";
            var result = await DynamoDatabaseTransactions.QueryTableUsingIndexAsync(keyExpression, expressionAttributeValues, "Index-1");
            if (result != null && result.Count > 0)
            {
                var item = result.FirstOrDefault();
                if (item != null)
                {
                    return MapFromDynamoItem(item);
                }

            }
            return null;

        }   
        public static async Task<List<Policy>> GetPoliciesByCustomerIDAsync(string customerId)
        {
            List<Policy> policies = new();
            var expressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                {":index2", new AttributeValue { S = customerId}}
            };
            string keyExpression = "Index2 = :index2";
            var result = await DynamoDatabaseTransactions.QueryTableUsingIndexAsync(keyExpression, expressionAttributeValues, "Index-2");
            foreach (var item  in result)
            {
              policies.Add(MapFromDynamoItem(item));

            }

            return policies;

        }
        public static async Task<Policy?> GetPolicyByIdAsync(string vendorId, string policyId)
        {
            var item = await DynamoDatabaseTransactions.GetItemByIdAsync(vendorId, policyId, "Policy");

            var policy = MapFromDynamoItem(item);

            return policy;
        }


        public static async Task<Policy?> GetPolicyByIdWithDocumentAsync(string vendorId, string policyId, string templateId, int merchantid )
        {
            var item = await DynamoDatabaseTransactions.GetItemByIdAsync(vendorId, policyId, "Policy");
           
            var policy =  MapFromDynamoItem(item);
            if(policy != null)
            {
                if(!policy.IsSignedAndPaid && !policy.IsSigned && string.IsNullOrEmpty(policy.SignPolicyLink))
                {
                    if(!string.IsNullOrEmpty(policy.QuoteFileName))
                    {
                        var document = new AmzS3Bucket("policy-uploads", $"{merchantid}/{policy.Id}");
                        var documentBytes = await document.ReadS3FileBytes();
                        DocumentFileBytes additionalDocument = new DocumentFileBytes
                        {
                            FileName = policy.QuoteFileName,
                            FileData = documentBytes, 
                            ContentType = "application/pdf"   
                        };
                    }
                    policy.SignPolicyLink = await BoldSignApi.BoldSignClient.GenerateBoldSignUrl(policy, vendorId, templateId, null);

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

            DateTime? ParseDate(string str)
            {
                if (string.IsNullOrWhiteSpace(str)) return null;

                return DateTime.TryParse(str, null, System.Globalization.DateTimeStyles.RoundtripKind, out var dt)
                    ? dt
                    : (DateTime?)null;
            }

            var policy = new Policy
            {
                Id = item["SK"].S,
                Amount = item.ContainsKey("Amount") && !string.IsNullOrEmpty(item["Amount"].N)
                    ? decimal.Parse(item["Amount"].N)
                    : 0,
                CommissionAmount = item.ContainsKey("CommissionAmount") && !string.IsNullOrEmpty(item["CommissionAmount"].N)
                    ? decimal.Parse(item["CommissionAmount"].N)
                    : 0,
                SubBrokerAmount = item.ContainsKey("SubBrokerAmount") && !string.IsNullOrEmpty(item["SubBrokerAmount"].N)
                    ? decimal.Parse(item["SubBrokerAmount"].N)
                    : 0,
                PaidByCustomer = item.ContainsKey("PaidByCustomer") && !string.IsNullOrEmpty(item["PaidByCustomer"].N)
                    ? decimal.Parse(item["PaidByCustomer"].N)
                    : 0,
                PaidToCarrier = item.ContainsKey("PaidToCarrier") && !string.IsNullOrEmpty(item["PaidToCarrier"].N)
                    ? decimal.Parse(item["PaidToCarrier"].N)
                    : 0,
                
                PolicyCode = item.ContainsKey("PolicyCode") ? item["PolicyCode"].S : "",
                CarrierName = item.ContainsKey("CarrierName") ? item["CarrierName"].S : "",
                SubBrokerName = item.ContainsKey("SubBrokerName") ? item["SubBrokerName"].S : "",
                PolicyStartDate = ParseDate(item.ContainsKey("PolicyStartDate") ? item["PolicyStartDate"].S : ""),
                PolicyEndDate = ParseDate(item.ContainsKey("PolicyEndDate") ? item["PolicyEndDate"].S : ""),
                PolicyDescription = item.ContainsKey("PolicyDescription") ? item["PolicyDescription"].S : "",
                QuoteFileName = item.ContainsKey("QuoteFileName") ? item["QuoteFileName"].S : "",
                SignPolicyLink = item.ContainsKey("SignPolicyLink") ? item["SignPolicyLink"].S : "",
                DocumentId = item.ContainsKey("Index1") ? item["Index1"].S : "",
                IsSignedAndPaid = item.ContainsKey("IsSignedAndPaid") && (item["IsSignedAndPaid"].BOOL ?? false) ? true : false,
                IsSigned = item.ContainsKey("IsSigned") && (item["IsSigned"].BOOL ?? false) ? true : false,
                VendorId = item["PK"].S.Replace("Vendor#", ""),

                Customer = new CustomerFilters
                {
                    CustomerId = item.ContainsKey("CardknoxCustomerId") ? item["CardknoxCustomerId"].S : "",
                    CustomerNumber = item.ContainsKey("CustomerNumber") ? item["CustomerNumber"].S : "",
                    BillPhoneNumber = item.ContainsKey("Phone") ? item["Phone"].S : "",
                    Email = item.ContainsKey("Email") ? item["Email"].S : "",
                    BillFirstName = item.ContainsKey("FirstName") ? item["FirstName"].S : "",
                    BillLastName = item.ContainsKey("LastName") ? item["LastName"].S : "",
                    BillCompany = item.ContainsKey("BillCompany") ? item["BillCompany"].S : "",
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

        public async Task UpdateDynamoAsync(string vendorid)
        {
            var item = GenerateIntoDynamoItem();
            await DynamoDatabaseTransactions.UpdateItemAsync(vendorid, item, this.Id.Replace("Policy#", ""), "Policy");
               
        }

        private Dictionary<string, AttributeValue> GenerateIntoDynamoItem ()
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
            AddNumber("CommissionAmount", CommissionAmount);
            AddNumber("SubBrokerAmount", SubBrokerAmount);
            AddNumber("PaidToCarrier", PaidToCarrier);
            AddNumber("PaidByCustomer", PaidByCustomer);
            AddString("PolicyCode", PolicyCode);
            AddString("PolicyDescription", PolicyDescription);
            AddString("QuoteFileName", QuoteFileName);
            AddString("Index1", DocumentId);
            AddString ("SignPolicyLink", SignPolicyLink);
            AddString("SubBrokerName", SubBrokerName);
            AddString("CarrierName", CarrierName);
           
            // Customer fields (null-safe)
            if (Customer != null)
            {
                AddString("CardknoxCustomerId", Customer.CustomerId);
                AddString("Index2", Customer.CustomerId);
                AddString("CustomerNumber", Customer.CustomerNumber);
                AddString("Phone", Customer.BillPhoneNumber);
                AddString("Email", Customer.Email);
                AddString("FirstName", Customer.BillFirstName);
                AddString("BillCompany", Customer.BillCompany);
                AddString("LastName", Customer.BillLastName);
                AddString("MiddleName", Customer.BillMiddleName);
                AddString("Mobile", Customer.BillMobile);
                AddString("Address", Customer.BillStreet);
                AddString("City", Customer.BillCity);
                AddString("State", Customer.BillState);
                AddString("Zip", Customer.BillZip);
            }

            newItem.Add("IsSignedAndPaid", IsSignedAndPaid ? new AttributeValue { BOOL = true } : new AttributeValue { BOOL = false });
            newItem.Add("IsSigned", IsSigned ? new AttributeValue { BOOL = true } : new AttributeValue { BOOL = false });
            return newItem;
        }

        public async Task InsertIntoDynamo(Vendor vendor)
        {
            var newItem = GenerateIntoDynamoItem(); 
            var newId = await WireRefNumGenerator.GenerateRefNumberAsync();
            

            newItem.Add("Date", new AttributeValue { S = Customer.CustomerId });

            await DynamoDatabaseTransactions.InsertItemAsync(
                vendor.Id.ToString(),
                newItem,
                newId,
                "Policy");

            Id = newId;
        }
    }
}
