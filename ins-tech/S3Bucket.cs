using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using AWSSDK;
using System.IO;

namespace ins_tech
{
    public class S3Bucket
    {
        private static readonly IAmazonS3 s3Client = new AmazonS3Client();

        private string bucketName { get; set; }
        private string fileName { get; set; }

        public S3Bucket(string bucketName, string fileName)
        {
            this.bucketName = bucketName;
            this.fileName = fileName;
        }

        public  async Task<string> ReadS3File()
        {
            GetObjectRequest request = new GetObjectRequest
            {
                BucketName = bucketName,
                Key = fileName
            };

            using (GetObjectResponse response =  s3Client.GetObject(request))
            using (StreamReader reader = new StreamReader(response.ResponseStream))
            {
                return await reader.ReadToEndAsync();
            }
        }

        public  async Task<string> UpdateFileContentAsync(string content)
        {
            var request = new PutObjectRequest
            {
                BucketName = bucketName,
                Key = fileName,
                ContentBody = content,
                ContentType =  "application/json" 
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
    }
}



