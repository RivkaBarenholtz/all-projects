using Amazon;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AmazonUtilities
{
    public static class SecretManager
    {
        
        public static async Task<string> GetSecret(string secretName)
        {
            string secret;

            IAmazonSecretsManager client = new AmazonSecretsManagerClient();

            var response = await GetSecretAsync(client, secretName);

            if (response is not null)
            {
                secret = DecodeString(response);

                if (!string.IsNullOrEmpty(secret))
                {
                    return secret;
                }
                else
                {
                    return "";
                }
            }
            return "";

        }
        private static async Task<GetSecretValueResponse> GetSecretAsync(
           IAmazonSecretsManager client,
           string secretName)
        {
            GetSecretValueRequest request = new GetSecretValueRequest()
            {
                SecretId = secretName,
                VersionStage = "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified.
            };

            GetSecretValueResponse response = null;

            // For the sake of simplicity, this example handles only the most
            // general SecretsManager exception.
            try
            {
                response = await client.GetSecretValueAsync(request);
            }
            catch (AmazonSecretsManagerException e)
            {
                Console.WriteLine($"Error: {e.Message}");
            }

            return response;
        }

        /// <summary>
        /// Decodes the secret returned by the call to GetSecretValueAsync and
        /// returns it to the calling program.
        /// </summary>
        /// <param name="response">A GetSecretValueResponse object containing
        /// the requested secret value returned by GetSecretValueAsync.</param>
        /// <returns>A string representing the decoded secret value.</returns>
        private static string DecodeString(GetSecretValueResponse response)
        {
            // Decrypts secret using the associated AWS Key Management Service
            // Customer Master Key (CMK.) Depending on whether the secret is a
            // string or binary value, one of these fields will be populated.
            if (response.SecretString is not null)
            {
                var secret = response.SecretString;
                return secret;
            }
            else if (response.SecretBinary is not null)
            {
                var memoryStream = response.SecretBinary;
                StreamReader reader = new StreamReader(memoryStream);
                string decodedBinarySecret = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(reader.ReadToEnd()));
                return decodedBinarySecret;
            }
            else
            {
                return string.Empty;
            }
        }
        public static async Task UpdateSecret(string secretName, string secretValue)
        {
            var client = new AmazonSecretsManagerClient(RegionEndpoint.USEast1);

            var updateRequest = new UpdateSecretRequest
            {
                SecretId = secretName,
                SecretString = secretValue
            };

            await client.UpdateSecretAsync(updateRequest);
        }
        public static async Task CreateSecret(string secretName, string secretValue)
        {
            var client = new AmazonSecretsManagerClient(RegionEndpoint.USEast1);

            var request = new CreateSecretRequest
            {
                Name = secretName,
                SecretString = secretValue
            };

            try
            {
                var response = await client.CreateSecretAsync(request);
                Console.WriteLine($"Secret Created: {response.ARN}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
        }
    }
}

