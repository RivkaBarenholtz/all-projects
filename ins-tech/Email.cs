using Amazon;
using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ins_tech
{
    public class Email
    {
        private static readonly string senderEmail = "info@mail.instechpay.co";
        private static string defaultEmail = "rivkyswia@gmail.com";
        private string recipientEmail = "";
        private string subject = "Test Email from AWS SES";
        private string body = "This is a test email from your webhook.";

        public Email(string recipientEmail, string subject, string body)
        {
            this.recipientEmail = recipientEmail;
            this.subject = subject;
            this.body = body;
        }

        public  async Task Send()
        {
            var recipientList = new List<string>();
            if(Utilities.IsValidEmail(recipientEmail))
            {
                recipientList.Add(recipientEmail);
            }
            else
            {
                string logMessage = $"No valid email found. Sending logs to default email to investigate.";
                this.body = $"{logMessage} {Environment.NewLine} {this.body}";
                recipientList.Add(defaultEmail);
            }

            using var client = new AmazonSimpleEmailServiceClient(RegionEndpoint.USEast1);

            var sendRequest = new SendEmailRequest
            {
                Source = senderEmail,
                
                Destination = new Destination { ToAddresses = recipientList },
                Message = new Message
                {
                    Subject = new Content(subject),
                    Body = new Body { Text = new Content(body) }
                }
            };



            await client.SendEmailAsync(sendRequest);
            Console.WriteLine("Email sent successfully.");
        }
    }


}
