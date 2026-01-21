using Amazon.S3.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.TransactionRequests
{
    public class EmailInvoiceRequest
    {
        public string Body { get; set; }
        public AttachmentInfo Attachment { get; set; }
        public List<string> recipients { get; set; } = new List<string>();

        public string Subject { get; set; }

    }

    public class AttachmentInfo
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public string Data { get; set; } // This will hold the "data:...base64,..." string
    }
}

