using Amazon.DynamoDBv2.Model;
using Amazon.Lambda.Core;
using AmazonUtilities;
using InsTechClassesV2;
using InsTechClassesV2.Cardknox;
using Newtonsoft.Json;
using Amazon.DynamoDBv2.DocumentModel;



// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace SyncCardknoxToDynamo;

public class Function
{
    
    /// <summary>
    /// A simple function that takes a string and does a ToUpper
    /// </summary>
    /// <param name="input">The event for the Lambda function handler to process.</param>
    /// <param name="context">The ILambdaContext that provides methods for logging and describing the Lambda environment.</param>
    /// <returns></returns>
    public async Task<string> FunctionHandler(string input, ILambdaContext context)
    {
        // for each vendor 
        var s3 = new AmzS3Bucket("insure-tech-vendor-data", "VendorData.json");
        string? vendorData = await s3.ReadS3File();

        List<Vendor>? vendors = JsonConvert.DeserializeObject<List<Vendor>>(vendorData);
        //vendors.Reverse();
        foreach (Vendor vendor in vendors)
        {

            var recordsReturned = 1000;
            var startDate = DateTime.UtcNow.AddDays(-60);
            var endDate = DateTime.UtcNow;

            CardknoxReportApiRequest cardknoxReportApiRequest = new();
            cardknoxReportApiRequest.xKey = await SecretManager.GetSecret(vendor.CardknoxApiKeySecretName);
            cardknoxReportApiRequest.xBeginDate = startDate.ToString("yyyy-MM-dd HH:mm:ss");
            cardknoxReportApiRequest.xEndDate = endDate.ToString("yyyy-MM-dd HH:mm:ss");

            while (recordsReturned == 1000)
            {
                
                var cardknoxResponse = await cardknoxReportApiRequest.PostToCardknox(vendor);
                string json = await cardknoxResponse.Content.ReadAsStringAsync();
                CardknoxTransactionReportResponse responseObject = JsonConvert.DeserializeObject<CardknoxTransactionReportResponse>(json) ?? new CardknoxTransactionReportResponse();
                recordsReturned = responseObject.ReportData.Count;
                var earliest = responseObject.ReportData.LastOrDefault().EnteredDate;
                var earliestDate = Convert.ToDateTime(earliest);
                var dynamoResult = await DynamoDatabaseTransactions.QueryTransactionsAsync($"Vendor#{vendor.Id}", earliestDate, endDate, "","", new List<string> { "ALL"}, new List<int> { -1 }, 1, 100000000);
                var dynamo = dynamoResult.resultSet;
                // get all cardknox records that don't exist in dynamo
                var newRecords = responseObject.ReportData.Where(r => !dynamo.Any(d => d["RefNumber"].S == r.RefNum)).ToList();
               
                var newDynamoList = new List<Dictionary<string, Amazon.DynamoDBv2.Model.AttributeValue>>();
                foreach (var record in newRecords)
                {
                    var newTransaction = TransactionsService.GenerateItemFromCardknoxTransaction(record);
                    string pk = $"Vendor#{vendor.Id}";
                    string sk = $"Transaction#{record.RefNum}";

                    newTransaction.Add("PK", new AttributeValue { S = pk });
                    newTransaction.Add("SK", new AttributeValue { S = sk });
                    newDynamoList.Add(newTransaction);
                }

                // insert new dynamo list 

                await DynamoDatabaseTransactions.BulkInsertAsync(newDynamoList);
                       
                // compare 
                foreach (var dynamoObj in dynamo)
                {
                    var cardknoxObj = responseObject.ReportData.FirstOrDefault(r => r.RefNum == dynamoObj["RefNumber"].S);
                    if (cardknoxObj != null)
                    { 
                        var updateObject = TransactionsService.GenerateItemFromCardknoxTransaction(cardknoxObj);
                        string pk = $"Vendor#{vendor.Id}";
                        string sk = $"Transaction#{cardknoxObj.RefNum}";

                        updateObject.Add("PK", new AttributeValue { S = pk });
                        updateObject.Add("SK", new AttributeValue { S = sk });
                        var same = DynamoDatabaseTransactions.AreDynamoItemsEqual(updateObject, dynamoObj);
                        if (!same) await DynamoDatabaseTransactions.UpdateItemAsync(vendor.Id.ToString(), updateObject, cardknoxObj.RefNum, "Transaction");
                    }
                    
                }
                endDate = earliestDate;
            }



        }
        //get data from cardknox 1000 records 
        


        // get data from dynamo db using oldest record end date and entitytype = transaction 

        // find all record that exist in cardknox that don't exist in our system 
        // insert them 
        // compare all records 
        // update different ones 

        return input.ToUpper();
    }

    
}
