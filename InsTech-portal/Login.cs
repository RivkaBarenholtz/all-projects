using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AmazonUtilities;
using Microsoft.IdentityModel.Tokens;

namespace InsTechPortal
{
    public class Login
    {

        private static JsonWebKeySet _cachedKeys;
        private static DateTime _lastKeyFetch = DateTime.MinValue;

        private static async Task<JsonWebKeySet> GetSigningKeysAsync(string userPoolId, string region)
        {
            if (_cachedKeys != null && DateTime.UtcNow - _lastKeyFetch < TimeSpan.FromHours(12))
                return _cachedKeys;

            string url = $"https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json";
            using var http = new HttpClient();
            string json = await http.GetStringAsync(url);
            _cachedKeys = new JsonWebKeySet(json);
            _lastKeyFetch = DateTime.UtcNow;
            return _cachedKeys;
        }
        public static async Task<ClaimsPrincipal?> ValidateTokenAsync(string token)
        {

            string userPoolId = "us-east-1_guWlEt63Z";
            string region = "us-east-1";
            string clientId = "7nmt8a8ooc0oq1lcaj70n474ff";

            var keys = await GetSigningKeysAsync(userPoolId, region);
            var tokenHandler = new JwtSecurityTokenHandler();

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"https://cognito-idp.{region}.amazonaws.com/{userPoolId}",

                ValidateAudience = true,
                ValidAudience = clientId,

                ValidateLifetime = true,
                RequireExpirationTime = true,

                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = keys.Keys,
            };

            try
            {
                var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                return principal;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Token validation failed: {ex.Message}");
                return null;
            }
        }
        private const string awsSecretName = "jwt-secret-generator";

        public static async  Task<bool> IsTokenValid(string token)
        {
            var claimsPrincipal = await ValidateTokenAsync(token);
            if (claimsPrincipal == null)
            {
                return false;
            }
            return true; 
        }



        public static async Task<string> HandleLogin(LoginRequest request)
        {
            // Simulate a database check (replace with actual user authentication logic)
            if (IsValidUser(request.Username, request.Password))
            {
                // Generate JWT token
                var token = await GenerateJwtToken(request.Username);
                return  token;
            }
            else
            {
                return "Invalid credentials";
            }
        }

        private static bool IsValidUser(string username, string password)
        {
            // Replace with real user authentication logic
            return username == "rivkyswia@gmail.com" && password == "password"; // Example validation
        }

        private static async Task< string> GenerateJwtToken(string username)
        {
            var secretKey = await SecretManager.GetSecret(awsSecretName);
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)); 
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, username),
            };

            var token = new JwtSecurityToken(
                issuer: "Insure-Tech", // optional
                audience: "Insure-Tech", // optional
                claims: claims,
                expires: DateTime.Now.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    
        
    
    }

    

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}



