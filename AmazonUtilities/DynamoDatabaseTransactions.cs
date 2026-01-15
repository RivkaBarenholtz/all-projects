using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using Amazon.Runtime.Internal;


// If the package is not available or you do not intend to use it, you can remove the using directive and any related code that depends on it.
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics.SymbolStore;
using static System.Runtime.InteropServices.JavaScript.JSType;


namespace AmazonUtilities
{
    public class DynamoDatabaseTransactions
    {
        private static readonly string tableName = "InsureTechData";
        private static readonly AmazonDynamoDBClient client = new AmazonDynamoDBClient();

        public static async Task<Dictionary<string, AttributeValue>?> GetItemByIdAsync(string VendorId, string id, string objectType)
        {
            string pk = $"Vendor#{VendorId}";
            string sk = $"{objectType}#{id}";

            var request = new GetItemRequest
            {
                TableName = tableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    { "PK", new AttributeValue { S = pk } },
                    {"SK", new AttributeValue { S = sk } }
                }
            };
            var response = await client.GetItemAsync(request);
            return response.Item;
        }

        //public static async Task<T?> GetItemInJsonAsync<T>(string pk, string sk) where T : class
        //{
        //    var request = new GetItemRequest
        //    {
        //        TableName = tableName,
        //        Key = new Dictionary<string, AttributeValue>
        //        {
        //            { "PK", new AttributeValue { S = pk } },
        //            { "SK", new AttributeValue { S = sk } }
        //        }
        //    };

        //    var response = await client.GetItemAsync(request);

        //    return DynamoSerializer.Deserialize<T>(response.Item);
        //}

    

        public static async Task<List<T>> GetItemsInJsonAsync<T>(string pk, string sk) where T : class
        {
            var request = new QueryRequest
            {
                TableName = tableName,

                KeyConditionExpression =
                "PK = :pk AND begins_with(SK, :sk)",

                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":pk"] = new AttributeValue { S = "VENDOR#INS" },
                    [":sk"] = new AttributeValue { S = "VENDOR#" }
                }
            };

            var result = new List<Dictionary<string, AttributeValue>>(); // Declare and initialize 'result'

            QueryResponse response;
            do
            {
                response = await client.QueryAsync(request);
                result.AddRange(response.Items); // Use 'result' to store the items
                request.ExclusiveStartKey = response.LastEvaluatedKey;

            } while (response.LastEvaluatedKey != null && response.LastEvaluatedKey.Count > 0);

            var context = new DynamoDBContext(new AmazonDynamoDBClient());
            var jsonResult = new List<T>();

            foreach (var item in result)
            {
                var doc = Document.FromAttributeMap(item);
                var obj = context.FromDocument<T>(doc);
                jsonResult.Add(obj);
            }

            return jsonResult;
        }

        private static (string updateExpression,
                   Dictionary<string, string> exprAttrNames,
                   Dictionary<string, AttributeValue> exprAttrValues) BuildUpdateExpression(Dictionary<string, AttributeValue> updates)
        {
            var exprAttrNames = new Dictionary<string, string>();
            var exprAttrValues = new Dictionary<string, AttributeValue>();
            var updateParts = new List<string>();
            int counter = 0;

            foreach (var kvp in updates)
            {
                string attrName = kvp.Key;
                string placeholderName = $"#attr{counter}";
                string placeholderValue = $":val{counter}";

                exprAttrNames[placeholderName] = attrName;
                exprAttrValues[placeholderValue] = kvp.Value;

                updateParts.Add($"{placeholderName} = {placeholderValue}");
                counter++;
            }

            string updateExpression = "SET " + string.Join(", ", updateParts);

            return (updateExpression, exprAttrNames, exprAttrValues);
        }
        public static async Task UpdateItemAsync(string VendorId, Dictionary<string, AttributeValue> updates, string id, string objectType)
        {
            if (updates.ContainsKey("PK")) updates.Remove("PK");
            if (updates.ContainsKey("SK")) updates.Remove("SK");
            var (updateExpression, exprAttrNames, exprAttrValues) = BuildUpdateExpression(updates);

            string pk = $"Vendor#{VendorId}";
            string sk = $"{objectType}#{id}";

            var request = new UpdateItemRequest
            {
                TableName = tableName,
                Key = new Dictionary<string, AttributeValue>
                {
                    { "PK", new AttributeValue { S = pk } },
                    { "SK", new AttributeValue { S = sk } }
                },
                UpdateExpression = updateExpression,
                ExpressionAttributeNames = exprAttrNames,
                ExpressionAttributeValues = exprAttrValues,
                ReturnValues = "ALL_NEW"
            };

            await client.UpdateItemAsync(request);
            Console.WriteLine($"item updated with PK: {pk}");
        }
        public static async Task InsertItemAsync(string VendorId, Dictionary<string, AttributeValue> item, string id, string objectType)
        {
            string pk = $"Vendor#{VendorId}";
            string sk = $"{objectType}#{id}";

            item.Add("PK", new AttributeValue { S = pk });
            item.Add("SK", new AttributeValue { S = sk });

            var request = new PutItemRequest
            {
                TableName = tableName,
                Item = item
            };

            await client.PutItemAsync(request);
            Console.WriteLine($"item inserted with PK: {pk}");
        }
    

      public static  async Task<DynamoResult> QueryTransactionsAsync(
        string clientPk,
        DateTime startDate,
        DateTime endDate,
        string refNum,
        string accountId,
        List<string> paymentMethods,
        List<int> statuses , 
        int pageNumber, 
        int itemsPerPage, 
        string  sortBy = "Date", 
        bool isAscending = false)
        {

            //TimeZoneInfo easternZone = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");

            //DateTime easternStart = DateTime.SpecifyKind(startDate, DateTimeKind.Unspecified);
            //DateTime easternEnd = DateTime.SpecifyKind(endDate, DateTimeKind.Unspecified);

            //DateTime utcStartDateTime = TimeZoneInfo.ConvertTimeToUtc(easternStart, easternZone);
            //DateTime utcEndDateTime = TimeZoneInfo.ConvertTimeToUtc(easternEnd, easternZone);

            
            
            var expressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                {":entityType", new AttributeValue { S = "Transaction" }},
                {":startDate", new AttributeValue { S = startDate.ToString("yyyy-MM-ddTHH:mm:ssZ") }},
                {":endDate", new AttributeValue { S = endDate.ToString("yyyy-MM-ddTHH:mm:ssZ") }},
                {":clientPk", new AttributeValue { S = clientPk }}
            };
            //if(!string.IsNullOrEmpty(refNum))
            //{
            //    expressionAttributeValues.Add(":refNum", new AttributeValue { S = refNum });
            //}

            var queryRequest = new QueryRequest
            {
                TableName = tableName,
                IndexName = "EntityType-Date-index",
                KeyConditionExpression = "EntityType = :entityType AND #date BETWEEN :startDate AND :endDate",
                FilterExpression = $"PK = :clientPk",
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                    { "#date", "Date" }  // date is a reserved word, so we alias it
                },
                ExpressionAttributeValues = expressionAttributeValues
            };

            var result = new List<Dictionary<string, AttributeValue>>();

            QueryResponse response;
            do
            {
                response = await client.QueryAsync(queryRequest);
                result.AddRange(response.Items);
                queryRequest.ExclusiveStartKey = response.LastEvaluatedKey;

            } while (response.LastEvaluatedKey != null && response.LastEvaluatedKey.Count > 0);

            result = SortItems(result, sortBy, isAscending);
            DynamoResult dynamoResult = new();
            result = FilteredResult(result, refNum, statuses, paymentMethods , accountId);
            dynamoResult.numberOfResults = result.Count;
            dynamoResult.total = result.Where(t => t.TryGetValue("ResponseResult", out var attributeValue) && attributeValue.S.ToLower() == "approved").Sum(av => av.TryGetValue("Amount", out var amountAttribute) ? Convert.ToDecimal(amountAttribute.N):0);
            
            dynamoResult.resultSet = result.Skip((pageNumber - 1) * itemsPerPage).Take(itemsPerPage).ToList();
            return dynamoResult;
        }

        private static List<Dictionary<string , AttributeValue>> FilteredResult(List<Dictionary<string, AttributeValue>> initialList,string  refNum, List<int>statuses, List<string > methods, string accountId )
        {
            if (refNum == "" && statuses.Contains(-1) && methods.Contains("ALL") && string.IsNullOrEmpty(accountId) ) return initialList; 
            List < Dictionary<string, AttributeValue> > filteredList= initialList;
            if (refNum != "")
            {
                filteredList = filteredList.Where(t => t.TryGetValue("RefNumber", out var attributeValue) && attributeValue.S.ToLower() == refNum.ToLower()).ToList();
            }
            if (!string.IsNullOrEmpty(accountId))
            {
                filteredList = filteredList.Where(t => t.TryGetValue("AccountID", out var attributeValue) && attributeValue.S.ToLower() == accountId.ToLower()).ToList();
            }
            if (!methods.Contains("ALL"))
            {
                if (methods.Count == 0) return new List<Dictionary<string, AttributeValue>>();

                if(!methods.Contains("Wire"))
                {
                    filteredList = filteredList.Where(t => t.TryGetValue("Command", out var attributeValue) && attributeValue.S.ToLower() != "wire funds").ToList();
                }
                if (!methods.Contains("Check"))
                {
                    filteredList = filteredList.Where(t => t.TryGetValue("Command", out var attributeValue) && !attributeValue.S.ToLower().StartsWith("check")).ToList();
                }
                if (!methods.Contains("CC"))
                {
                    filteredList = filteredList.Where(t => t.TryGetValue("Command", out var attributeValue) && !attributeValue.S.ToLower().StartsWith("cc")).ToList();
                }

            }
            if (!statuses.Contains(-1))
            {
                if (statuses.Count == 0) return new List<Dictionary<string, AttributeValue>>();

                if( ! statuses.Contains(25))
                {
                    filteredList = filteredList.Where(t => t.TryGetValue("ResponseResult", out var attributeValue) && attributeValue.S.ToLower() != "error").ToList();
                }
                if (!statuses.Contains(24))
                {
                    filteredList = filteredList.Where(t => t.TryGetValue("ResponseResult", out var attributeValue) && attributeValue.S.ToLower() != "declined").ToList();
                }
                if (!statuses.Contains(23))
                {
                    filteredList = filteredList.Where(t => t.TryGetValue("Status", out var attributeValue) && attributeValue.S.ToLower() != "14").ToList();
                }

                if (!statuses.Contains(22))
                {
                    filteredList = filteredList.Where(
                        t => !(t.TryGetValue("ResponseResult", out var attributeValue) && attributeValue.S.ToLower() == "approved"
                        && t.TryGetValue("Command", out var attributeValue1) && attributeValue1.S.ToLower() == "check:sale"
                        && t.TryGetValue("Status", out var attributeValue2) && attributeValue2.S.ToLower() == "0"
                        )
                        ).ToList();
                }
                if (!statuses.Contains(21))
                {
                    filteredList = filteredList.Where(
                        t => !(t.TryGetValue("ResponseResult", out var attributeValue) && attributeValue.S.ToLower() == "approved"
                        &&
                        (
                            t.TryGetValue("Command", out var attributeValue1) && attributeValue1.S.ToLower() == "cc:sale" ||
                            t.TryGetValue("Status", out var attributeValue2) && attributeValue2.S == "16"
                        )
                        )).ToList();
                }
                            }
            return filteredList;
        }
        public static async Task BulkInsertAsync( List<Dictionary<string, AttributeValue>> items)
        {
            const int batchSize = 25;
            for (int i = 0; i < items.Count; i += batchSize)
            {
                var batchItems = items.GetRange(i, Math.Min(batchSize, items.Count - i));

                var writeRequests = new List<WriteRequest>();
                foreach (var item in batchItems)
                {
                    List<KeyValuePair<string, AttributeValue>> subitemstoRemove = new(); 
                    foreach (var subItem in item)
                    {
                        if (subItem.Value.N == null && subItem.Value.B == null && subItem.Value.M == null && subItem.Value.L == null && subItem.Value.S == null)
                            subitemstoRemove.Add(subItem);
                    }
                    foreach(var subitem in subitemstoRemove)
                    {
                        item.Remove(subitem.Key);
                    }
                    writeRequests.Add(new WriteRequest
                    {
                        PutRequest = new PutRequest { Item = item }
                    });
                }

                var request = new BatchWriteItemRequest
                {
                    RequestItems = new Dictionary<string, List<WriteRequest>>
                    {
                        { tableName, writeRequests }
                    }
                };

                // Retry loop for unprocessed items
                BatchWriteItemResponse response;
                do
                {
                    response = await client.BatchWriteItemAsync(request);

                    if (response.UnprocessedItems.TryGetValue(tableName, out var unprocessed))
                    {
                        request.RequestItems[tableName] = unprocessed;
                        await Task.Delay(100); // backoff
                    }
                    else
                    {
                        break;
                    }

                } while (response.UnprocessedItems.Count > 0);
            }
        }

        public static bool AreDynamoItemsEqual(Dictionary<string, AttributeValue> a, Dictionary<string, AttributeValue> b)
        {
            if (a.Count != b.Count)
                return false;

            foreach (var key in a.Keys)
            {
                if (!b.ContainsKey(key))
                    return false;

                if (!AreAttributeValuesEqual(a[key], b[key]))
                    return false;
            }

            return true;
        }
        public static List<Dictionary<string, AttributeValue>> SortItems(
            List<Dictionary<string, AttributeValue>> items,
            string sortBy,
            bool ascending = true)
        {
            Func<Dictionary<string, AttributeValue>, object> keySelector = item =>
            {
                
                if (!item.ContainsKey(sortBy??"Date"))
                    return null;

                var attr = item[sortBy];

                // Handle the main DynamoDB AttributeValue types
                if (attr.S != null) return attr.S;
                if (attr.N != null) return decimal.TryParse(attr.N, out var d) ? d : 0;
                if (attr.BOOL != null) return attr.BOOL;
                if (attr.M != null) return attr.M.Count; // Example: map length
                if (attr.L != null) return attr.L.Count; // Example: list length

                return null;
            };

            return ascending
                ? items.OrderBy(keySelector).ToList()
                : items.OrderByDescending(keySelector).ToList();
        }

        private static bool AreAttributeValuesEqual(AttributeValue a, AttributeValue b)
        {
            if (a.S != null) return a.S == b.S;
            if (a.N != null) return Convert.ToDecimal(a.N) == Convert.ToDecimal(a.N);
            if (a.BOOL != null) return a.BOOL == b.BOOL;
            if (a.NULL != null) return b.NULL == true;
            if (a.SS != null) return a.SS.OrderBy(x => x).SequenceEqual(b.SS?.OrderBy(x => x).ToList() ?? new List<string>());
            if (a.NS != null) return a.NS.OrderBy(x => x).SequenceEqual(b.NS?.OrderBy(x => x).ToList() ?? new List<string>());
            if (a.M != null && b.M != null) return AreDynamoItemsEqual(a.M, b.M);
            if (a.L != null && b.L != null)
            {
                if (a.L.Count != b.L.Count) return false;
                for (int i = 0; i < a.L.Count; i++)
                {
                    if (!AreAttributeValuesEqual(a.L[i], b.L[i])) return false;
                }
                return true;
            }

            // fallback: assume unequal
            return false;
        }
    }

    public class DynamoResult
    {
        public int numberOfResults { get; set;  }
        public decimal total { get; set; }
        public List<Dictionary<string, AttributeValue>> resultSet { get; set; }

    }
}

