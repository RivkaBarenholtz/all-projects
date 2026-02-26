using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Amazon.Runtime.Internal;
using BoldSign.Api;
using BoldSign.Model;

namespace InsTechClassesV2.BoldSignApi
{
    public class BoldSignClient
    {
        public static string apiKey = "NmM5Nzk3NGQtNmRhMi00Mzk4LWJiZmYtMGUwOWI4YWJjOTIy";
        public async static Task<string> GenerateBoldSignUrl ( Policy policy, string vendorid, string templateId , DocumentFileBytes? additionalDocument)
        {
            Console.WriteLine("Generating URL for boldsign");
            var boldSignApiClient = new ApiClient() { ApiKey = "NmM5Nzk3NGQtNmRhMi00Mzk4LWJiZmYtMGUwOWI4YWJjOTIy" };
           
            var template = new TemplateClient();
            var document = new DocumentClient();
           
            
           
            SendForSignFromTemplate sendForSignFromTemplate = new SendForSignFromTemplate()
            {
                TemplateId =templateId, 
               
                DisableEmails = true,
                Roles = [
                    new Roles(){
                        RoleIndex =1,
                        SignerName = policy.Customer.BillFirstName +" " + policy.Customer.BillLastName,
                        SignerEmail = policy.Customer.Email, 
                        SignerType = SignerType.Signer,
                        ExistingFormFields = [
                            new ExistingFormField{
                             Id = "Policy",
                             Value = policy.PolicyCode,
                               IsReadOnly = true

                        },    new ExistingFormField{
                             Id = "CustomerName",
                             Value = policy.Customer.BillFirstName, 
                               IsReadOnly = true

                        },    new ExistingFormField{
                             Id = "Contact",
                             Value = policy.Customer.Email,
                               IsReadOnly = true

                        },    new ExistingFormField{
                             Id = "Amount",
                             Value = policy.Amount.ToString(),
                             IsReadOnly = true 


                        }, 



                            ]
                    }
                    
                    ]

            };
            if(additionalDocument != null)
            {
                sendForSignFromTemplate.Files =new List<IDocumentFile> { additionalDocument }; 
            }

            var a = await template.SendUsingTemplateAsync(sendForSignFromTemplate);
            var b = a.DocumentId;

            policy.DocumentId = a.DocumentId; 

           

            var c = await document.GetEmbeddedSignLinkAsync(b,policy.Customer.Email);
            policy.SignPolicyLink = c.SignLink; 
            await policy.UpdateDynamoAsync(vendorid);
            return c.SignLink;

            
        }

        public async static Task <string> DownloadSignedDocument (string _documentid)
        {

            var apiClient = new ApiClient("https://api.boldsign.com",apiKey);
            var documentClient = new DocumentClient(apiClient);
           
            using var fileStream = await documentClient.DownloadDocumentAsync(_documentid);
            using var memoryStream = new MemoryStream();

            await fileStream.CopyToAsync(memoryStream);

            var fileBytes = memoryStream.ToArray();
            var base64 = Convert.ToBase64String(fileBytes);
            return base64;

        }
    }
}
