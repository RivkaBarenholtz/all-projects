using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
   public  class BatchReceipt
    {
        public BatchReceipt( string batchId, int receiptId )
        {
            this.BatchId = batchId;
            this.ReceiptId = receiptId;
        }
        public string BatchId { get; set; }
        public int ReceiptId { get; set; }

        public string ReceiptDescription { get; set; } = ""; 
       
    }
}
