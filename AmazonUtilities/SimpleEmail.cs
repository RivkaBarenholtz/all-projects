using Amazon.SimpleEmail.Model;
using Amazon.SimpleEmail;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Amazon;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Net.Mail;

namespace AmazonUtilities
{
    public class SimpleEmail
    {
        private static readonly string senderEmail = "InsTech 360 <no-reply@mail.instechpay.co>";
        private  List<string> defaultEmail = new List<string>();
        private List<string> recipientEmail = new List<string>();
        private string subject = "Test Email from AWS SES";
        private string body = "This is a test email from your webhook.";
        public byte[] Attachment;

        public List<AttachmentFile> attachmentFiles = new List<AttachmentFile>();
        public class AttachmentFile
        {
            public string FileName { get; set; }
            public byte[] FileContent { get; set; }
        }
        public SimpleEmail(List<string> recipientEmail, string subject, string body, List<string> defaultEmail)
        {
            this.recipientEmail = recipientEmail;
            this.subject = subject;
            this.body = body;
            this.defaultEmail = defaultEmail;
        }
        private static bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
        public static string ReplacePlaceholders(string template, object data)
        {
            if (string.IsNullOrEmpty(template) || data == null)
                return template;

            var type = data.GetType();

            // Match placeholders like $$PropertyName$$
            return Regex.Replace(template, @"\$\$(\w+)\$\$", match =>
            {
                var propertyName = match.Groups[1].Value;

                // Look for the property on the object (case-insensitive)
                var property = type.GetProperty(propertyName,
                    BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);

                if (property == null)
                    return match.Value; // keep original placeholder if not found

                var value = property.GetValue(data, null);
                return value?.ToString() ?? string.Empty;
            });
        }
        public async Task SendFromTemplate (string fileName , object data )
        {
            var s3 = new AmzS3Bucket("insure-tech-email-templates", fileName);
            string? templateContent = await s3.ReadS3File();
            if (templateContent != null)
            {
                this.body = ReplacePlaceholders(templateContent, data);
                await Send();
            }
        }
        public async Task Send(Boolean ishtml = true)
        {
            List<string> emailListEnumerator = new List<string>();
            emailListEnumerator.AddRange(recipientEmail);
            foreach (string recipient in emailListEnumerator)
            {
                if (!IsValidEmail(recipient))
                {
                    recipientEmail.Remove(recipient);
                }
            }
            if (recipientEmail.Count == 0 )
            {
                string logMessage = $"No valid email found. Sending logs to default email to investigate.";
                this.body = $"{logMessage} {Environment.NewLine} {this.body}";
               
            }
            recipientEmail.AddRange(defaultEmail);
            using var client = new AmazonSimpleEmailServiceClient(RegionEndpoint.USEast1);

             // ***************************************************
            // MIME message construction (required for attachments)
            // ***************************************************
            var boundary = "NextPart_" + DateTime.Now.Ticks.ToString("x");
            var message = new StringBuilder();

            message.AppendLine("From: " + senderEmail);
            message.AppendLine("To: " + string.Join(",", recipientEmail));
            message.AppendLine("Subject: " + subject);
            message.AppendLine("MIME-Version: 1.0");
            message.AppendLine($"Content-Type: multipart/mixed; boundary=\"{boundary}\"");
            message.AppendLine();

            // -------------------------
            // Email body (HTML + Text)
            // -------------------------
            message.AppendLine("--" + boundary);
            if (ishtml) message.AppendLine("Content-Type: text/html; charset=\"UTF-8\"");
            else message.AppendLine("Content-Type: text/plain; charset=\"UTF-8\"");
            message.AppendLine("Content-Transfer-Encoding: 7bit");
            message.AppendLine();
            message.AppendLine(body);
            message.AppendLine();

            // -------------------------
            // Attachment
            // -------------------------
            if (Attachment != null && Attachment.Length > 0)
            {
                string attachmentName = "attachment.pdf"; // TODO: make dynamic if needed

                message.AppendLine("--" + boundary);
                message.AppendLine("Content-Type: application/octet-stream; name=\"" + attachmentName + "\"");
                message.AppendLine("Content-Description: " + attachmentName);
                message.AppendLine("Content-Disposition: attachment; filename=\"" + attachmentName + "\"; size=" + Attachment.Length + ";");
                message.AppendLine("Content-Transfer-Encoding: base64");
                message.AppendLine();
                message.AppendLine(Convert.ToBase64String(Attachment));
                message.AppendLine();
            }

            if (attachmentFiles.Count > 0)
            {
                foreach (var file in attachmentFiles)
                {
                    message.AppendLine("--" + boundary);
                    message.AppendLine("Content-Type: application/octet-stream; name=\"" + file.FileName + "\"");
                    message.AppendLine("Content-Description: " + file.FileName);
                    message.AppendLine("Content-Disposition: attachment; filename=\"" + file.FileName + "\"; size=" + file.FileContent.Length + ";");
                    message.AppendLine("Content-Transfer-Encoding: base64");
                    message.AppendLine();
                    message.AppendLine(Convert.ToBase64String(file.FileContent));
                    message.AppendLine();
                }
            }
            message.AppendLine("--" + boundary + "--");

            var rawMessage = new RawMessage
            {
                Data = new MemoryStream(Encoding.UTF8.GetBytes(message.ToString()))
            };

            var sendRequest = new SendRawEmailRequest
            {
                RawMessage = rawMessage,
                Source = senderEmail,
                Destinations = recipientEmail
            };

            await client.SendRawEmailAsync(sendRequest);

            Console.WriteLine("Email with attachment sent successfully.");
        }
       
    }
}
