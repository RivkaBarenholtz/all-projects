using Amazon.SimpleEmail.Model;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http;

namespace ins_tech
{
    public static class ApiClient
    {
        public static async Task<HttpResponseMessage> CallApiAsync(string url, HttpMethod method, Dictionary<string, string> queryParams, object content, AuthenticationHeaderValue auth, Dictionary<string, string> headers)
        {
            try
            {

                using (HttpClient client = new HttpClient())
                {
                    using (HttpRequestMessage request = new HttpRequestMessage(method, url))
                    {
                        if (auth != null) request.Headers.Authorization = auth;
                        foreach (var header in headers)
                        {
                            request.Headers.Add(header.Key, header.Value);
                        }
                        request.Headers.AcceptLanguage.ParseAdd("en-US");
                        request.Headers.TryAddWithoutValidation("Content-Type", "application/json");
                        var queryString = "";

                        if (queryParams.Count > 0)
                            queryString = await new FormUrlEncodedContent(queryParams).ReadAsStringAsync();

                        if (content != null)
                        {
                            var settings = new JsonSerializerSettings
                            {
                                NullValueHandling = NullValueHandling.Ignore
                            };
                            string jsonContent = JsonConvert.SerializeObject(content, settings);
                            request.Content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                        }

                        request.RequestUri = new Uri($"{url}?{queryString}");
                        // Send the GET request
                        HttpResponseMessage response = await client.SendAsync(request);

                        string json = await response.Content.ReadAsStringAsync();
                        return response;

                    }

                }
            }
            catch (Exception ex)
            {
                return new HttpResponseMessage(System.Net.HttpStatusCode.InternalServerError)
                {
                    Content = new StringContent(ex.Message)
                };
            }
        }


    }
}
