using AmazonUtilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
    public class InvoiceSurcharge
    {
        public InvoiceSurcharge(int _invoiceNumber)
        {
            this.InvoiceNumber = _invoiceNumber;
        }
        public static async Task<List<InvoiceSurcharge>> LoadMany(Vendor vendor, List<int> _invoiceNumbers)
        {
            List<InvoiceSurcharge>? invoices = await FileDataUtility.GetList<InvoiceSurcharge>(vendor.s3BucketName, "InvoiceSurcharges.json");
            if (invoices != null)
            {
                var selectedInvoices = invoices.Where(c => _invoiceNumbers.Contains(c.InvoiceNumber)).ToList();
                if (selectedInvoices != null && selectedInvoices.Count > 0 )
                {
                    return selectedInvoices;
                }

            }
            return new List<InvoiceSurcharge>();
        }
       
        public static async Task<InvoiceSurcharge> Load(Vendor vendor, int _invoiceNumber)
        {

            List<InvoiceSurcharge>? invoices = await FileDataUtility.GetList<InvoiceSurcharge>(vendor.s3BucketName, "InvoiceSurcharges.json");
            if (invoices != null)
            {
                var invoice = invoices.Where(c => c.InvoiceNumber == _invoiceNumber).FirstOrDefault();
                if (invoice != null)
                {
                    return invoice;
                }

            }
            return new InvoiceSurcharge(_invoiceNumber);
        }
        public async Task Save(Vendor vendor, decimal _customSurcharge, Boolean _isEditable)
        {
            
            List<InvoiceSurcharge>? invoices = await FileDataUtility.GetList<InvoiceSurcharge>(vendor.s3BucketName, "InvoiceSurcharges.json");
            if (invoices == null)
            {
                invoices = new List<InvoiceSurcharge>();
            }

            InvoiceSurcharge? invoice = null;
            if (invoices != null)
            {
                invoice = invoices.Where(c => c.InvoiceNumber == this.InvoiceNumber).FirstOrDefault();
                if (invoice != null)
                {
                    invoice.CustomSurcharge = _customSurcharge;
                    invoice.IsEditable = _isEditable;
                }

            }
            if (invoice == null)
            {
                this.CustomSurcharge = _customSurcharge;
                this.IsEditable = _isEditable;
                invoices.Add(this);
            }
            ;
            var ClientSurchargeFile = new AmzS3Bucket(vendor.s3BucketName, "InvoiceSurcharges.json");
            await ClientSurchargeFile.UpdateFileContentAsync(Newtonsoft.Json.JsonConvert.SerializeObject(invoices));
        }
        public  async Task Delete(Vendor vendor)
        {
            List<InvoiceSurcharge>? invoices = await FileDataUtility.GetList<InvoiceSurcharge>(vendor.s3BucketName, "InvoiceSurcharges.json");
            if (invoices != null)
            {
                var invoice = invoices.Where(c => c.InvoiceNumber == this.InvoiceNumber).FirstOrDefault();
                if (invoice != null)
                {
                    invoices.Remove(invoice);
                    var ClientSurchargeFile = new AmzS3Bucket(vendor.s3BucketName, "InvoiceSurcharges.json");
                    await ClientSurchargeFile.UpdateFileContentAsync(Newtonsoft.Json.JsonConvert.SerializeObject(invoices));
                }
            }
        }
        public int InvoiceNumber { get; set; } = 0;
        public decimal? CustomSurcharge { get; set; }

        public Boolean IsEditable { get; set; } 
    }
}
