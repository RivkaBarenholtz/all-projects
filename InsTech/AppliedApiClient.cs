using System;
using System.Net.Http;
using System.Text.Json;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http.Headers;
using System.Text.Json.Nodes;
using Newtonsoft.Json;
using System.Text.Json.Serialization;
//using Amazon.SimpleEmail.Model;

namespace InsTech
{
    public class AppliedApiClient
    {
        private static async Task<string> Authenticate(Vendor vendor)
        {
            string AuthServerUrl = "https://api.myappliedproducts.com/v1/auth/connect/token";
            string key = await AWSSecretManager.GetSecret(vendor.apiKeySecretName);
            string secret = await AWSSecretManager.GetSecret(vendor.apiSecretSecretName); //"";_S1UrQ2puPgojsLIXb1VIFfimJovWxuF3AxWMXoKThhncsqphMQiiiUavcuOkF2K

            string authString = $"{key}:{secret}";

            // Encode the auth string to Base64
            string base64Auth = Convert.ToBase64String(Encoding.UTF8.GetBytes(authString));

            // Set headers
            var request = new HttpRequestMessage(HttpMethod.Post, AuthServerUrl);
            request.Headers.Add("Authorization", $"Basic {base64Auth}");

            // Set data
            var content = new StringContent("grant_type=client_credentials&audience=api.myappliedproducts.com/epic", Encoding.UTF8, "application/x-www-form-urlencoded");

            try
            {
                using (var client = new HttpClient())
                {
                    request.Content = content;

                    // Make the POST request
                    HttpResponseMessage response = await client.SendAsync(request);

                    if (response.IsSuccessStatusCode)
                    {
                        string responseBody = await response.Content.ReadAsStringAsync();

                        // Parse the access token from the JSON response
                        using var jsonDoc = JsonDocument.Parse(responseBody);
                        string accessToken = jsonDoc.RootElement.GetProperty("access_token").GetString();

                        Console.WriteLine("Access Token: " + accessToken);

                        // Save the token to a file

                        return accessToken ?? "Error: Token is null";
                    }
                    else
                    {
                        Console.WriteLine("Error: " + (int)response.StatusCode + " - " + response.ReasonPhrase);
                        string errorContent = await response.Content.ReadAsStringAsync();
                        Console.WriteLine("Error Details: " + errorContent);
                        return errorContent;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("An error occurred: " + ex.Message);
                return $"Error: {ex.Message}";
            }

        }
        private static async Task<string> GetTokenAsync(Vendor vendor)
        {
            // Read the token from the file
            string token = await AWSSecretManager.GetSecret(vendor.accessTokenSecretName);
            if (token == null || token == "")
            {

                var newToken = await Authenticate(vendor);
                if (newToken != null)
                {
                    AWSSecretManager.CreateSecret(vendor.accessTokenSecretName, newToken);
                    token = newToken;
                }
            }
            return token ?? "";

        }
        public static Task<HttpResponseMessage> GetObject(string url, Dictionary<string, string> queryParams, Vendor vendor)
        {
            return CallApiAsync(url, HttpMethod.Get, queryParams, null, vendor);
        }
        public static Task<HttpResponseMessage> PostObject(string url, object content, Vendor vendor)
        {
            return CallApiAsync(url, HttpMethod.Post, new Dictionary<string, string>(), content, vendor);
        }
        public static Task<HttpResponseMessage> PutObject(string url, object content, Vendor vendor)
        {
            return CallApiAsync(url, HttpMethod.Put, new Dictionary<string, string>(), content, vendor);
        }
        private static async Task<HttpResponseMessage> CallApiAsync(string url, HttpMethod method, Dictionary<string, string> queryParams, object content, Vendor vendor, bool retry = true)
        {
            string token = await GetTokenAsync(vendor);
            var auth = new AuthenticationHeaderValue("Bearer", token);
            Dictionary<string, string> headers = new Dictionary<string, string>() { { "Asi-Client-Correlation-Id", vendor.AsiClientCorrelationId } };
            HttpResponseMessage response = await ApiClient.CallApiAsync(url, method, queryParams, content, auth, headers);
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                var newToken = await Authenticate(vendor);
                if (newToken != null)
                {
                    await AWSSecretManager.UpdateSecret(vendor.accessTokenSecretName, newToken);
                    if (retry)
                    {
                        return await CallApiAsync(url, method, queryParams, content, vendor, false);
                    }
                }
            }
            return response;

        }
        private class TokenResponse
        {
            public string Access_Token { get; set; }
        }
    }

}
