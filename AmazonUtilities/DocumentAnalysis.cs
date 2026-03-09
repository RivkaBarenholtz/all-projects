
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Amazon.Textract;
using Amazon.Textract.Model;
using Newtonsoft.Json;
using static System.Reflection.Metadata.BlobBuilder;

namespace AmazonUtilities
{
    public static class DocumentAnalysis
    {

        public static async Task<List<Block>> GetTextractResultsAsync(string jobId)
        {
            using var client = new AmazonTextractClient();
            var blocks = new List<Block>();
            string nextToken = null;

            do
            {
                var response = await client.GetDocumentAnalysisAsync(new GetDocumentAnalysisRequest
                {
                    JobId = jobId,
                    NextToken = nextToken
                });

                blocks.AddRange(response.Blocks);

                nextToken = response.NextToken;

            } while (!string.IsNullOrEmpty(nextToken));

            return blocks;
        }
        static string BuildFullDocumentPrompt(List<Block> blocks)
        {
            var sb = new StringBuilder();

            // 1️⃣ Include key/value pairs (forms)
            var keyBlocks = blocks
                .Where(b => b.BlockType == BlockType.KEY_VALUE_SET && b.EntityTypes.Contains("KEY"));

            foreach (var keyBlock in keyBlocks)
            {
                string keyText = keyBlock.Text;
                var valueId = keyBlock.Relationships?
                    .FirstOrDefault(r => r.Type == RelationshipType.VALUE)?
                    .Ids.FirstOrDefault();
                string valueText = blocks.FirstOrDefault(b => b.Id == valueId)?.Text ?? "";

                sb.AppendLine($"{keyText}: {valueText}");
            }

            sb.AppendLine("\n--- Table Data ---\n");

            // 2️⃣ Include tables
            var tableBlocks = blocks.Where(b => b.BlockType == BlockType.TABLE);
            foreach (var table in tableBlocks)
            {
                var cellBlocks = blocks
                    .Where(b => b.BlockType == BlockType.CELL && b.Relationships != null &&
                                b.Relationships.Any(r => r.Type == RelationshipType.CHILD && r.Ids.Contains(b.Id)));

                // Simple table output
                foreach (var cell in cellBlocks)
                {
                    sb.Append($"{cell.Text}\t");
                }
                sb.AppendLine();
            }

            sb.AppendLine("\n--- Full Document Lines ---\n");

            // 3️⃣ Include all lines of text
            foreach (var line in blocks.Where(b => b.BlockType == BlockType.LINE))
            {
                sb.AppendLine(line.Text);
            }

            return sb.ToString();
        }
        public static async Task<string> CallBedrock(string prompt)
        {
            using var client = new AmazonBedrockRuntimeClient();

            var bodyObject = new
            {
                anthropic_version = "bedrock-2023-05-31",
                max_tokens = 2048,
                temperature = 0,
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = new[]
                        {
                            new { type = "text", text = prompt }
                        }
                    }
                }
            };

            var bodyJson = JsonConvert.SerializeObject(bodyObject);

            var request = new InvokeModelRequest
            {
                ModelId = "arn:aws:bedrock:us-east-1:664418966079:inference-profile/global.anthropic.claude-sonnet-4-6",
                ContentType = "application/json",
                Body = new MemoryStream(Encoding.UTF8.GetBytes(bodyJson))
            };
            Console.WriteLine(request.ModelId); 
            var response = await client.InvokeModelAsync(request);

            using var reader = new StreamReader(response.Body);
            var responseBody = await reader.ReadToEndAsync();

            return responseBody;
        }
        public static async Task<string> GetJsonResponseFromBedrockAsync(string jobid)
        {

            var blocks = await GetTextractResultsAsync(jobid);
            string documentText = BuildFullDocumentPrompt(blocks);

            string prompt = $@"
            Extract the following fields from this document, if they are there- (if not provided, return empty string), as a JSON array of objects: 'PolicyName','PolicyId','CustomerAddressLine1', 'CustomerCity', 'CustomerState' , 'CustomerZip',  'CustomerName', 'TotalPremiumAmount'.

            Document:
            {documentText}
            ";
            return await CallBedrock(prompt);
        }
        public static async Task<string> GetTextractJobStatusAsync(string jobId)
        {
            using var client = new AmazonTextractClient();
            var response = await client.GetDocumentAnalysisAsync(
                new GetDocumentAnalysisRequest
                {
                    JobId = jobId
                });

            return response.JobStatus.ToString();


        }


        public static async Task<string> StartTextractJob(string bucket, string key)
        {
            using var client = new AmazonTextractClient();

            var request = new StartDocumentAnalysisRequest
            {
                DocumentLocation = new DocumentLocation
                {
                    S3Object = new S3Object
                    {
                        Bucket = bucket,
                        Name = key
                    },

                },
                FeatureTypes = new List<string> { "FORMS", "TABLES" },


            };

            var response = await client.StartDocumentAnalysisAsync(request);

            return response.JobId;
        }



    }
}
