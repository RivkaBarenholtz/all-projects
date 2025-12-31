using Amazon.S3.Model;
using Amazon.S3;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;

namespace AmazonUtilities
{

    public class AmzS3Bucket
    {
        private static readonly IAmazonS3 s3Client = new AmazonS3Client();

        private string bucketName { get; set; }
        private string fileName { get; set; }

        public AmzS3Bucket(string bucketName, string fileName)
        {
            this.bucketName = bucketName;
            this.fileName = fileName;
        }

        public async Task<string> ReadS3File()
        {
            GetObjectRequest request = new GetObjectRequest
            {
                BucketName = bucketName,
                Key = fileName
            };

            using (GetObjectResponse response = await s3Client.GetObjectAsync(request))
            using (StreamReader reader = new StreamReader(response.ResponseStream))
            {
                return await reader.ReadToEndAsync();
            }
        }


        public async Task<string> UpdateFileContentAsync(string content)
        {
            var request = new PutObjectRequest
            {
                BucketName = bucketName,
                Key = fileName,
                ContentBody = content,
                ContentType = "application/json"
            };

            try
            {
                var response = await s3Client.PutObjectAsync(request);
                return "Upload successful.";
            }
            catch (Exception ex)
            {
                return $"Error uploading: {ex.Message}";
            }
        }

        public async Task SaveAsJsonLinesAsync<T>(List<T> data)
        {
            var options = new JsonSerializerOptions
            {
                WriteIndented = false  // IMPORTANT: No pretty printing!
            };

            // Serialize each object to a single line
            var lines = data.Select(item => JsonSerializer.Serialize(item, options));

            // Join with newlines
            var content = string.Join("\n", lines);

            var request = new PutObjectRequest
            {
                BucketName = bucketName,
                Key = fileName,
                ContentBody = content,
                ContentType = "application/json"
            };

            await s3Client.PutObjectAsync(request);
        }

        // Append single record (efficient - doesn't read existing file)
        public async Task AppendRecordAsync<T>(T record)
        {
            var options = new JsonSerializerOptions
            {
                WriteIndented = false
            };

            var newLine = JsonSerializer.Serialize(record, options) + "\n";

            try
            {
                // Get existing content
                
                var existingContent = await this.ReadS3File();

                // Append new line
                var updatedContent = existingContent + newLine;

                // Write back
                var putRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = fileName,
                    ContentBody = updatedContent,
                    ContentType = "application/json"
                };

                await s3Client.PutObjectAsync(putRequest);
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                // File doesn't exist, create new
                var putRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = fileName,
                    ContentBody = newLine,
                    ContentType = "application/json"
                };

                await s3Client.PutObjectAsync(putRequest);
            }
        }


        public async Task<List<T>> QueryJsonLinesAsync<T>(string whereClause)
        {
            var request = new SelectObjectContentRequest
            {
                BucketName = bucketName,
                Key = fileName,
                ExpressionType = ExpressionType.SQL,
                Expression = $"SELECT * FROM S3Object s WHERE {whereClause}",
                InputSerialization = new InputSerialization
                {
                    JSON = new JSONInput
                    {
                        JsonType = JsonType.Lines
                    }
                },
                OutputSerialization = new OutputSerialization
                {
                    JSON = new JSONOutput()
                }
            };

            var results = new StringBuilder();

            SelectObjectContentResponse response = null;

            response = await s3Client.SelectObjectContentAsync(request);
            var payload = response.Payload;

            foreach (var ev in payload)
            {
                if (ev is RecordsEvent recordsEvent)
                {
                    using var reader = new StreamReader(recordsEvent.Payload);
                    var content = await reader.ReadToEndAsync();
                    results.Append(content);
                }
                else if (ev is StatsEvent statsEvent)
                {
                    Console.WriteLine($"Bytes scanned: {statsEvent.Details.BytesScanned}");
                    Console.WriteLine($"Bytes processed: {statsEvent.Details.BytesProcessed}");
                    Console.WriteLine($"Bytes returned: {statsEvent.Details.BytesReturned}");
                }
            }



            // Parse results - S3 Select returns records separated by newlines or commas
            var json = results.ToString().Trim();

           return DeserializeS3SelectResponse<T>(json);
        }

        public static List<T> DeserializeS3SelectResponse<T>(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new List<T>();

            // Normalize: split on newlines or commas between objects
            var lines = json
                .Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(l => l.Trim().TrimEnd(','))
                .Where(l => !string.IsNullOrWhiteSpace(l))
                .ToList();

            if (!lines.Any())
                return new List<T>();

            // Build a proper JSON array
            var normalizedJson = "[" + string.Join(",", lines) + "]";

            return JsonSerializer.Deserialize<List<T>>(normalizedJson)
                ?? new List<T>();
        }

    }
}

