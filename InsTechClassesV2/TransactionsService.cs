using Amazon.DynamoDBv2.Model;
using AmazonUtilities;
using InsTechClassesV2.Cardknox;
using InsTechClassesV2.TransactionRequests;
using System.Globalization;
using System.Numerics;
using System.Security.Cryptography;



namespace InsTechClassesV2
{
    public static class TransactionsService
    {
        const string EntityName = "Transaction";

        public static async Task <Cardknox.CardknoxTransactionReportResponse> GetTransactions(int vendorID, DateTime FromDate , DateTime ToDate, string refNum, string accountid, List<string> paymentMethods, List<int> statuses, string sortBy , int pageNumber, int itemsPerPage, bool isAscending = false  )
        {
            Cardknox.CardknoxTransactionReportResponse response = new();
            List<Cardknox.CardknoxReportItem> reportItems = new List<Cardknox.CardknoxReportItem>();
            var dynamoResult =   await AmazonUtilities.DynamoDatabaseTransactions.QueryTransactionsAsync($"Vendor#{vendorID}", FromDate,  ToDate, refNum,accountid, paymentMethods,  statuses, pageNumber, itemsPerPage, sortBy, isAscending  );
            var items = dynamoResult.resultSet;
            foreach (var item in items)
            {
                Cardknox.CardknoxReportItem reportItem = new();
                reportItem.RefNum = item["RefNumber"].S;
                reportItem.AchReturnFee = item.ContainsKey("AchReturnFee") ? item["AchReturnFee"].S : string.Empty;
                reportItem.ResponseResult= item.ContainsKey("ResponseResult") ? item["ResponseResult"].S : string.Empty;
                reportItem.Amount = item.ContainsKey("Amount") ? decimal.Parse(item["Amount"].N) : 0;
                reportItem.BillLastName = item.ContainsKey("AccountID") ? item["AccountID"].S : string.Empty;
                reportItem.BillFirstName = item.ContainsKey("BillFirstName") ? item["BillFirstName"].S : string.Empty;
                reportItem.BillCity = item.ContainsKey("BillCity") ? item["BillCity"].S : string.Empty;
                reportItem.BillState = item.ContainsKey("BillState") ? item["BillState"].S : string.Empty;
                reportItem.BillCompany = item.ContainsKey("BillCompany") ? item["BillCompany"].S : string.Empty;
                reportItem.Zip = item.ContainsKey("Zip") ? item["Zip"].S : string.Empty;
                reportItem.Email = item.ContainsKey("Email") ? item["Email"].S : string.Empty;
                reportItem.BillPhone = item.ContainsKey("BillPhone") ? item["BillPhone"].S : string.Empty;
                reportItem.RequestAmount = item.ContainsKey("RequestAmount") ? item["RequestAmount"].S : string.Empty;
                reportItem.Token = item.ContainsKey("Token") ? item["Token"].S : string.Empty;
                reportItem.CardLastFour = item.ContainsKey("CardLastFour") ? item["CardLastFour"].S : string.Empty;
                reportItem.Expiration = item.ContainsKey("Exp") ? item["Exp"].S : string.Empty;
                reportItem.CardType = item.ContainsKey("CardType") ? item["CardType"].S : string.Empty; 
                reportItem.Command = item.ContainsKey("Command") ? item["Command"].S : string.Empty;
                reportItem.Custom01 = item.ContainsKey("CardknoxCustomer") ? item["CardknoxCustomer"].S : string.Empty;
                reportItem.Custom02 = item.ContainsKey("CsrCode") ? item["CsrCode"].S : string.Empty;
                reportItem.Custom03 = item.ContainsKey("CsrEmail") ? item["CsrEmail"].S : string.Empty;
                reportItem.Custom09 = item.ContainsKey("TransactionFee") ? item["TransactionFee"].S : string.Empty;
                reportItem.EnteredDate = item.ContainsKey("Date") ? item["Date"].S : string.Empty;
                reportItem.ErrorCode = item.ContainsKey("ErrorCode") ? item["ErrorCode"].S : string.Empty;
                reportItem.Invoice = item.ContainsKey("Invoice") ? item["Invoice"].S : string.Empty;
                reportItem.MaskedAccountNumber = item.ContainsKey("MaskedAccountNumber") ? item["MaskedAccountNumber"].S : string.Empty;
                reportItem.MaskedCardNumber = item.ContainsKey("MaskedCardNumber") ? item["MaskedCardNumber"].S : string.Empty;
                reportItem.Name = item.ContainsKey("Name") ? item["Name"].S : string.Empty;
                reportItem.Status = item.ContainsKey("Status") ? item["Status"].S : string.Empty;
                reportItem.Void  = item.ContainsKey("Void") ? item["Void"].S : string.Empty;
                reportItem.Custom10 = item.ContainsKey("FundedAmount") ? item["FundedAmount"].S : string.Empty;
                reportItems.Add(reportItem);
            }
            response.ReportData = reportItems;
            response.RecordsReturned = dynamoResult.numberOfResults.ToString();
            response.Result = dynamoResult.total.ToString();
            return response ;
        }
        public static Dictionary<string, AttributeValue> GenerateItemFromWireRequesst(SubmitWireRequest transaction)
        {
            var formats = new[] {
                 "M/d/yyyy h:mm:ss tt",
                 "MM/dd/yyyy h:mm:ss tt",
                 "M/d/yyyy hh:mm:ss tt",
                 "MM/dd/yyyy hh:mm:ss tt",
             };

            DateTime datetime = DateTime.UtcNow;


            
            // 3. Format as ISO 8601 (sortable)
            string sortableDate = datetime.ToString("yyyy-MM-ddTHH:mm:ssZ");

            var NewOrUpdatedTransaction = new Dictionary<string, AttributeValue>(){
                    {
                        "EntityType", new AttributeValue { S = "Transaction" }
                    },
                    {
                        "RefNumber", new AttributeValue { S = transaction.RefNumber }
                    },
                    {
                        "Command", new AttributeValue { S = "Send Wire" }
                    },
                    {
                        "Amount", new AttributeValue { N = transaction.Amount.ToString() }
                    },
                    {
                        "ResponseResult", new AttributeValue { S = "Approved" }
                    },


                    {
                        "Status", new AttributeValue { S ="Unconfirmed" }
                    },
                    {
                        "TransactionDate", new AttributeValue { S = sortableDate}
                    } ,
                    {
                        "Date", new AttributeValue { S = sortableDate}
                    } 

            };
            
            
            {
                NewOrUpdatedTransaction.Add("FundedAmount", new AttributeValue { S = transaction.Amount.ToString() });
            }
            
            
            
            if (!string.IsNullOrEmpty(transaction.CsrEmail))
            {
                NewOrUpdatedTransaction.Add("CsrEmail", new AttributeValue { S = transaction.CsrEmail });
            }

            if (!string.IsNullOrEmpty(transaction.CsrCode))
            {
                NewOrUpdatedTransaction.Add("CsrCode", new AttributeValue { S = transaction.CsrCode });
            }



            if (!string.IsNullOrEmpty(transaction.AccountId))
            {
                NewOrUpdatedTransaction.Add("AccountID", new AttributeValue { S = transaction.AccountId });
            }

            if (!string.IsNullOrEmpty(transaction.InvoiceNumber))
            {
                NewOrUpdatedTransaction.Add("Invoice", new AttributeValue { S = transaction.InvoiceNumber });
            }

            
            if (!string.IsNullOrEmpty(transaction.Email))
            {
                NewOrUpdatedTransaction.Add("Email", new AttributeValue { S = transaction.Email });
            }
            if (!string.IsNullOrEmpty(transaction.City))
            {
                NewOrUpdatedTransaction.Add("BillCity", new AttributeValue { S = transaction.City });
            }
            if (!string.IsNullOrEmpty(transaction.State))
            {
                NewOrUpdatedTransaction.Add("BillState", new AttributeValue { S = transaction.State });
            }
            
            if (!string.IsNullOrEmpty(transaction.Phone))
            {
                NewOrUpdatedTransaction.Add("BillPhone", new AttributeValue { S = transaction.Phone });
            }
            if (!string.IsNullOrEmpty(transaction.BillingAddress))
            {
                NewOrUpdatedTransaction.Add("Street", new AttributeValue { S = transaction.BillingAddress });
            }
            if (!string.IsNullOrEmpty(transaction.Zip))
            {
                NewOrUpdatedTransaction.Add("Zip", new AttributeValue { S = transaction.Zip });
            }

           
            return NewOrUpdatedTransaction;
        }
        public static Dictionary<string, AttributeValue>GenerateItemFromCardknoxTransaction(CardknoxReportItem transaction)
        {
            var formats = new[] {
                 "M/d/yyyy h:mm:ss tt",
                 "MM/dd/yyyy h:mm:ss tt",
                 "M/d/yyyy hh:mm:ss tt",
                 "MM/dd/yyyy hh:mm:ss tt",
             };

            DateTime localDateTime = DateTime.ParseExact(transaction.EnteredDate, formats, CultureInfo.InvariantCulture);


            TimeZoneInfo easternZone = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time");
            DateTime utcDateTime = TimeZoneInfo.ConvertTimeToUtc(localDateTime, easternZone);

            // 3. Format as ISO 8601 (sortable)
            string sortableDate = utcDateTime.ToString("yyyy-MM-ddTHH:mm:ssZ");

            var NewOrUpdatedTransaction = new Dictionary<string, AttributeValue>(){
                    {
                        "EntityType", new AttributeValue { S = "Transaction" }
                    },
                    {
                        "RefNumber", new AttributeValue { S = transaction.RefNum }
                    },
                    {
                        "Command", new AttributeValue { S = transaction.Command }
                    },
                    {
                        "Amount", new AttributeValue { N = transaction.Amount.ToString() }
                    },
                   

                    {
                        "Status", new AttributeValue { S = transaction.Status }
                    },
                    {
                        "TransactionDate", new AttributeValue { S = sortableDate}
                    } ,
                    {
                        "Date", new AttributeValue { S = sortableDate}
                    } ,
                    {
                        "ResponseResult", new AttributeValue { S = transaction.ResponseResult}
                    }

            };
            if (!string.IsNullOrEmpty(transaction.Custom10) && transaction.Custom10 != "0")
            {
                NewOrUpdatedTransaction.Add("FundedAmount", new AttributeValue { S = transaction.Custom10 });
            }
            else
            {
                NewOrUpdatedTransaction.Add("FundedAmount", new AttributeValue { S = transaction.Amount.ToString() });
            }
            if (!string.IsNullOrEmpty(transaction.CardLastFour))
            {
                NewOrUpdatedTransaction.Add("CardLastFour", new AttributeValue { S = transaction.CardLastFour });
            }
            if (!string.IsNullOrEmpty(transaction.MaskedCardNumber) )
            {
                NewOrUpdatedTransaction.Add("MaskedCardNumber", new AttributeValue { S = transaction.MaskedCardNumber });
            }
            if (!string.IsNullOrEmpty(transaction.Expiration))
            {
                NewOrUpdatedTransaction.Add("Exp", new AttributeValue { S = transaction.Expiration });
            }
            if (!string.IsNullOrEmpty(transaction.Token) )
            {
                NewOrUpdatedTransaction.Add("Token", new AttributeValue { S = transaction.Token });
            }
             if (!string.IsNullOrEmpty(transaction.RequestAmount) )
            {
                NewOrUpdatedTransaction.Add("RequestAmount", new AttributeValue { S = transaction.RequestAmount });
            }

            if (!string.IsNullOrEmpty(transaction.Custom09))
            {
                NewOrUpdatedTransaction.Add("TransactionFee", new AttributeValue { S = transaction.Custom09 });
            }

            if (!string.IsNullOrEmpty(transaction.Custom03))
            {
                NewOrUpdatedTransaction.Add("CsrEmail", new AttributeValue { S = transaction.Custom03 });
            }

            if (!string.IsNullOrEmpty(transaction.Custom02))
            {
                NewOrUpdatedTransaction.Add("CsrCode", new AttributeValue { S = transaction.Custom02 });
            }
            


            if (!string.IsNullOrEmpty(transaction.Custom01))
            {
                NewOrUpdatedTransaction.Add("CardknoxCustomer", new AttributeValue { S = transaction.Custom01 });
            }


            if (!string.IsNullOrEmpty(transaction.ErrorCode))
            {
                NewOrUpdatedTransaction.Add("ErrorCode", new AttributeValue { S = transaction.ErrorCode });
            }


            if (!string.IsNullOrEmpty(transaction.BillLastName))
            {
                NewOrUpdatedTransaction.Add("AccountID", new AttributeValue { S = transaction.BillLastName });
            }

            if (!string.IsNullOrEmpty(transaction.Invoice))
            {
                NewOrUpdatedTransaction.Add("Invoice", new AttributeValue { S = transaction.Invoice });
            }

            if (!string.IsNullOrEmpty(transaction.Void))
            {
                NewOrUpdatedTransaction.Add("Void", new AttributeValue { S = transaction.Void });
            }
            if (!string.IsNullOrEmpty(transaction.Email))
            {
                NewOrUpdatedTransaction.Add("Email", new AttributeValue { S = transaction.Email });
            }
            if (!string.IsNullOrEmpty(transaction.BillCity))
            {
                NewOrUpdatedTransaction.Add("BillCity", new AttributeValue { S = transaction.BillCity });
            }
            if (!string.IsNullOrEmpty(transaction.BillState))
            {
                NewOrUpdatedTransaction.Add("BillState", new AttributeValue { S = transaction.BillState });
            }
            if (!string.IsNullOrEmpty(transaction.BillCompany))
            {
                NewOrUpdatedTransaction.Add("BillCompany", new AttributeValue { S = transaction.BillCompany });
            }
            if (!string.IsNullOrEmpty(transaction.BillFirstName))
            {
                NewOrUpdatedTransaction.Add("BillFirstName", new AttributeValue { S = transaction.BillFirstName });
            }
            if (!string.IsNullOrEmpty(transaction.BillPhone))
            {
                NewOrUpdatedTransaction.Add("BillPhone", new AttributeValue { S = transaction.BillPhone });
            }
            if (!string.IsNullOrEmpty(transaction.Street))
            {
                NewOrUpdatedTransaction.Add("Street", new AttributeValue { S = transaction.Street });
            }
            if (!string.IsNullOrEmpty(transaction.Zip))
            {
                NewOrUpdatedTransaction.Add("Zip", new AttributeValue { S = transaction.Zip });
            }

            if (!string.IsNullOrEmpty(transaction.Routing))
            {
                NewOrUpdatedTransaction.Add("Routing", new AttributeValue { S = transaction.Routing });
            }

            if (!string.IsNullOrEmpty(transaction.CardType))
            {
                NewOrUpdatedTransaction.Add("CardType", new AttributeValue { S = transaction.CardType });
            }
            if (!string.IsNullOrEmpty(transaction.Name))
            {
                NewOrUpdatedTransaction.Add("Name", new AttributeValue { S = transaction.Name });
            }

            if (!string.IsNullOrEmpty(transaction.ResponseBatch))
            {
                NewOrUpdatedTransaction.Add("ResponseBatch", new AttributeValue { S = transaction.ResponseBatch });
            }
            if (!string.IsNullOrEmpty(transaction.MaskedAccountNumber))
            {
                NewOrUpdatedTransaction.Add("MaskedAccountNumber", new AttributeValue { S = transaction.MaskedAccountNumber });
            }

            if (!string.IsNullOrEmpty(transaction.AchReturnFee))
            {
                NewOrUpdatedTransaction.Add("AchReturnFee", new AttributeValue { S = transaction.AchReturnFee });
            }
            return NewOrUpdatedTransaction;

        }
        public static async Task SaveWireTransaction (SubmitWireRequest transaction, Vendor vendor)
        {
            var NewOrUpdatedTransaction = GenerateItemFromWireRequesst(transaction);
            await AmazonUtilities.DynamoDatabaseTransactions.InsertItemAsync(vendor.Id.ToString(), NewOrUpdatedTransaction, transaction.RefNumber, EntityName);
            
        }
        public static async Task SaveTransaction(string refNumber , Vendor vendor)
        {
            string key = await SecretManager.GetSecret(vendor.CardknoxApiKeySecretName);

            var cardknox = await new CardknoxTransactionReportApiRequest(refNumber, key).GetCardknoxTransactionReportResponse(vendor);
            var transaction = cardknox.ReportData[0];

            
            var dynamoDBObject = await AmazonUtilities.DynamoDatabaseTransactions.GetItemByIdAsync(vendor.Id.ToString(), refNumber, EntityName);
            
            var NewOrUpdatedTransaction = GenerateItemFromCardknoxTransaction(transaction);

            if (dynamoDBObject == null)
            {
                //foreach (var kv in NewOrUpdatedTransaction)
                //{
                //    Console.WriteLine($"Key: {kv.Key}, Value: {FormatValue(kv.Value)}");
                //}
                await AmazonUtilities.DynamoDatabaseTransactions.InsertItemAsync(vendor.Id.ToString(), NewOrUpdatedTransaction, refNumber, EntityName);
            }
            else
            {
                await AmazonUtilities.DynamoDatabaseTransactions.UpdateItemAsync( vendor.Id.ToString(), NewOrUpdatedTransaction, refNumber, EntityName);
            }

        }

        static string FormatValue(AttributeValue val)
        {
            if (val.S != null) return $"S: '{val.S}'";
            if (val.N != null) return $"N: '{val.N}'";
            if (val.BOOL.HasValue) return $"BOOL: {val.BOOL}";
            if (val.NULL.HasValue && val.NULL.Value) return $"NULL";
            if (val.SS != null) return $"SS: {string.Join(",", val.SS)}";
            if (val.NS != null) return $"NS: {string.Join(",", val.NS)}";
            if (val.L != null) return $"List of {val.L.Count} items";
            if (val.M != null) return $"Map of {val.M.Count} items";
            return "Unknown or empty";
        }
    }
}
