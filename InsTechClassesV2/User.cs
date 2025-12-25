using Amazon.DynamoDBv2.Model;
using AmazonUtilities;
using AmazonUtilities.DynamoDatabase;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
    public class User
    {
        public string Username { get; set; }

        public int VendorId { get; set; }
        public List<string> Vendors = new();
        public string FullName { get; set; }
        public string Role = "User";

        public static async Task CreateUserInCognitoAndDynamoDb(Cognito cognitoUser)
        {
            

            var user = await GetUserAsync(cognitoUser.Email);
            if (user?.Count == 0 || user== null  )
            {
                
                var newUser =  await cognitoUser.CreateCognitoUser();
               
            }
            var s3 = new AmzS3Bucket("insure-tech-vendor-data", "Users.jsonl");

            await s3.AppendRecordAsync<Cognito>(cognitoUser);


            var email = new SimpleEmail(new List<string>() { cognitoUser.Email }, "Welcome" , "", new List<string>() );
            await email.SendFromTemplate("welcome_email.html", cognitoUser);

            List<Cognito> list = await  s3.QueryJsonLinesAsync<Cognito>(" LOWER(s.Role) = 'admin'");

            var notificationEmail = new SimpleEmail(list.Select(e => e.Email).ToList(), "New User Added", "", new List<string>());
            notificationEmail.SendFromTemplate("new_user.html", cognitoUser).Wait();

        }

        public static async Task<List<Cognito>> GetUsersAsync(int VendorId)//probably very bad performance wise - if it takes too long think of a better way 
        {
            var s3 = new AmzS3Bucket("insure-tech-vendor-data", "Users.jsonl");
            List<Cognito> users = await s3.QueryJsonLinesAsync<Cognito>($"s.vendorId={VendorId}");
       
            return users;
        }

        private static User ConvertDynamoToUser (Dictionary<string , AttributeValue> item)
        {
            User user = new User();
            if (item.TryGetValue("PK", out var name))
            {
                user.Username = name.S;
            }
            if (item.TryGetValue("Vendors", out var vendors))
            {
                user.Vendors = vendors.NS.ToList();
            }
            if (item.TryGetValue("Role", out var role))
            {
                user.Role = role.S;
            }
             if (item.TryGetValue("FullName", out var fullName))
            {
                user.FullName = fullName.S;
            }
            return user;
        }

        public static async Task UpdateUser (Cognito cognitoUser)
        {
            var s3 = new AmzS3Bucket("insure-tech-vendor-data", "Users.jsonl");
            var allUsers = await s3.QueryJsonLinesAsync<Cognito>("1=1");

            if(!cognitoUser.Disabled )
            {
                var isUserCompletelyDisabled = !allUsers.Any(u => u.Email == cognitoUser.Email && u.Disabled == false);
                if (isUserCompletelyDisabled)
                {
                    await cognitoUser.ReEnableUser();
                }
            }
           
            var userToRemove = allUsers.FirstOrDefault(u => u.Email == cognitoUser.Email && u.VendorId == cognitoUser.VendorId);
            if (userToRemove != null)
            {
                allUsers.Remove(userToRemove);
                allUsers.Add(cognitoUser);
            }

            if (cognitoUser.Disabled)
            {
                var isUserCompletelyDisabled = !allUsers.Any(u => u.Email == cognitoUser.Email && u.Disabled == false);
                if (isUserCompletelyDisabled)
                {
                    await cognitoUser.DisableUser();
                }
            }


            await s3.SaveAsJsonLinesAsync<Cognito>(allUsers);
        }

        public static async Task<List<Cognito>?> GetUserAsync(string username)
        {

            var s3 = new AmzS3Bucket("insure-tech-vendor-data", "Users.jsonl");

            List<Cognito> users = await s3.QueryJsonLinesAsync<Cognito>($"s.email='{username}' and s.Disabled=false");

            return users; 
        }
    }
}
