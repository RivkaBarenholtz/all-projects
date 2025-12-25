using Amazon.S3.Model;
using AmazonUtilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
    public class ClientSurcharge
    {
        public ClientSurcharge (string _lookupCode)
        {
            this.LookupCode = _lookupCode;
        }
        
        public static  async Task <ClientSurcharge> Load(Vendor vendor, string _lookupCode)
        {
            
            List<ClientSurcharge>? clients = await FileDataUtility.GetList<ClientSurcharge>(vendor.s3BucketName, "ClientSurcharges.json");
            if (clients != null)
            {
                var client = clients.Where(c => c.LookupCode.ToUpper() == _lookupCode.ToUpper()).FirstOrDefault();
                if (client != null)
                {
                    return client;
                }

            }
            return new ClientSurcharge(_lookupCode) { CustomSurcharge= vendor.InsureTechFeePercentage};
        }
        public async Task Delete(Vendor vendor)
        {
            List<ClientSurcharge>? clients = await FileDataUtility.GetList<ClientSurcharge>(vendor.s3BucketName, "ClientSurcharges.json");
            if (clients != null)
            {
                var client = clients.Where(c => c.LookupCode == this.LookupCode).FirstOrDefault();
                if (client != null)
                {
                    clients.Remove(client);
                    var ClientSurchargeFile = new AmzS3Bucket(vendor.s3BucketName, "ClientSurcharges.json");
                    await ClientSurchargeFile.UpdateFileContentAsync(Newtonsoft.Json.JsonConvert.SerializeObject(clients));
                }
            }
        }
        public async Task Save(Vendor vendor, decimal _customSurcharge )
        {
            
            List<ClientSurcharge>? clients = await FileDataUtility.GetList<ClientSurcharge>(vendor.s3BucketName, "ClientSurcharges.json");
            if (clients == null)
            {
                clients = new List<ClientSurcharge>();
            }

            ClientSurcharge? client = null;
            if (clients != null)
            {
                client = clients.Where(c => c.LookupCode == this.LookupCode).FirstOrDefault();
                if (client != null)
                {
                    client.CustomSurcharge = _customSurcharge;
                }

            }
            if (client == null)
            {
                this.CustomSurcharge = _customSurcharge;
               clients.Add(this);
            };
            var ClientSurchargeFile = new AmzS3Bucket(vendor.s3BucketName, "ClientSurcharges.json");
            await ClientSurchargeFile.UpdateFileContentAsync(Newtonsoft.Json.JsonConvert.SerializeObject(clients));
        }
        public string LookupCode { get; set; } = "";
        public decimal? CustomSurcharge { get; set; }
    }
}
