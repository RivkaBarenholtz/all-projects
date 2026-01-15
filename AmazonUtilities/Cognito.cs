using Amazon.CognitoIdentityProvider.Model;
using Amazon.CognitoIdentityProvider;
using Amazon;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AmazonUtilities
{
    public class Cognito
    {
        private string userPoolId = "us-east-1_guWlEt63Z";
        public string Email { get; set; }
        public string AddedBy { get; set; }
        public bool Disabled { get; set; } = false;
        public string Password { get; set; }
        public string FullName { get; set; }
        public string AccountName { get; set; }
        public int VendorId { get; set; }   

        public string Role { get; set; } = "user"; 

        public string GenerateNewPassword()
        {
            return $"Aa1!{Guid.NewGuid()}".Substring(0, 12);
        }

        public async Task DisableUser()
        {
            var client = new AmazonCognitoIdentityProviderClient(RegionEndpoint.USEast1);
            var request = new AdminDisableUserRequest
            {
                UserPoolId = userPoolId,
                Username = Email
            };
            var response = await client.AdminDisableUserAsync(request);
        }

        public async Task ReEnableUser ()
        {
            var client = new AmazonCognitoIdentityProviderClient(RegionEndpoint.USEast1);
            var request = new AdminEnableUserRequest
            {
                UserPoolId = userPoolId,
                Username = Email
            };
            var response = await client.AdminEnableUserAsync(request);
        }
        public async Task<CreateUserResult> CreateCognitoUser()
        {
            Password = GenerateNewPassword();

            var client = new AmazonCognitoIdentityProviderClient(RegionEndpoint.USEast1);

            var request = new AdminCreateUserRequest
            {
                UserPoolId = userPoolId,
                Username = Email,                 // username = email
                TemporaryPassword = Password, 
                MessageAction = "SUPPRESS",       // prevents Cognito email
                UserAttributes = new List<AttributeType>
                {
                    new AttributeType { Name = "email", Value = Email },
                    new AttributeType { Name = "email_verified", Value = "true" },
                    new AttributeType { Name = "name", Value = FullName }  //added here

                }
            };

            var response = await client.AdminCreateUserAsync(request);

            // Set password to permanent? NO — leave it temporary so user must change it.

            return new CreateUserResult
            {
                TemporaryPassword = Password,
                UserSub = response.User.Attributes.First(a => a.Name == "sub").Value
            };
        }

        public class CreateUserResult
        {
            public string TemporaryPassword { get; set; }
            public string UserSub { get; set; }
        }

    }
}
