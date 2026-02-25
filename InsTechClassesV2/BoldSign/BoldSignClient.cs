using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BoldSign.Api;
using BoldSign.Model;

namespace InsTechClassesV2.BoldSignApi
{
    public class BoldSignClient
    {
        public async static Task<string> GenerateBoldSignUrl ( Policy policy, string vendorid )
        {
            Console.WriteLine("Generating URL for boldsign");
            var boldSignApiClient = new ApiClient() { ApiKey = "NmM5Nzk3NGQtNmRhMi00Mzk4LWJiZmYtMGUwOWI4YWJjOTIy" };
           
            var template = new TemplateClient();
            var document = new DocumentClient();

            
           
            SendForSignFromTemplate sendForSignFromTemplate = new SendForSignFromTemplate()
            {
                TemplateId = "00c9edd5-7e95-40f1-9748-4cfb323c108c", 
                
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

            var a = await template.SendUsingTemplateAsync(sendForSignFromTemplate);
            var b = a.DocumentId;

            policy.DocumentId = a.DocumentId; 
            await policy.UpdateDynamoAsync(vendorid);

            var c = await document.GetEmbeddedSignLinkAsync(b,policy.Customer.Email);
            return c.SignLink;

            
        }
    }
}
