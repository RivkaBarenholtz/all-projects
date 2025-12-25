using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
   public class GlobalLog
    {
        public string CardknoxAccount { get; set; }           // $$CardknoxAccount$$
        public string AccountName { get; set; }               // $$AccountName$$
        public string EnteredName { get; set; }
        public string AccountNumber { get; set; }             // $$AccountNumber$$
        public string Amount { get; set; }                    // $$Amount$$ (keep string to preserve formatting like "$123.45")
        public string RefNum { get; set; }                    // $$RefNum$$
        public string BatchNumber { get; set; }               // $$BatchNumber$$
        public string InvoiceNumber { get; set; }             // $$InvoiceNumber$$

        // --- Client Lookup Section ---
        public string AccountID { get; set; }                 // $$AccountID$$
        public string ClientNotFoundDisplay { get; set; } = "none";    // $$clientNotFoundDisplay$$ (e.g., "block" or "none")
        public string ClientFoundDisplay { get; set; } = "block";     // $$clientFoundDisplay$$ (e.g., "block" or "none")

        // --- Receipt Status Section ---
        public string ReceiptID { get; set; }                 // $$ReceiptID$$
        public string ReceiptDisplay { get; set; } = "block";          // $$receiptDisplay$$ (show/hide section)
        public string ErrorDisplay { get; set; } = "none";          // $$errorDisplay$$ (show/hide section)
        public string ErrorText { get; set; }                 // $$ErrorText$$

        public string InvoiceMessage { get; set; } = "";
       


        private  string _log = "";
        public  void AddToLog(string message)
        {
           _log += message + Environment.NewLine;
        }
        public  string GetLog()
        {
            return _log;
        }
    }
}
