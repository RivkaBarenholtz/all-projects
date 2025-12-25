using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechPortal
{
    public class CardknoxReportRequest
    {
        public List<int> Statuses { get; set; }  =new ();
        public List<string> PaymentMethods { get; set; } = new();

        public string AccountID { get; set; }

        public int PageNumber { get; set; }
        public int TransactionsPerPage { get; set;  }
        public string SortBy { get; set; }
        public bool IsAsc { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        
        public string RefNum { get; set; }
        public decimal Amount { get; set;  }
        public string CardholderName { get; set; }
        public string AccountNumber { get; set; }
        public string Command { get; set; }

        public int AchStatus { get; set;  }

        public int Batch { get; set; }
        public string CardType { get; set; }

        public string CsrCode { get;set; }

        public string InvoiceNumber { get;set; }
        public string CreditCardStatus { get; set; }
    }
}
