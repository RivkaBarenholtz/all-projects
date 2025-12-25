using InsTechClassesV2.Utility;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.AppliedEpic
{
    public class AppliedEpicTransaction
    { 
        public TransactionEnvelope Envelope { get; set; }
    }

    public class TransactionEnvelope
    {
        public TransactionBody Body { get; set; }
    }
    public class TransactionBody
    {
        public GetTransactionResponse Get_TransactionResponse { get; set; }
    }
    public class GetTransactionResponse
    {
        public GetTransactionResult Get_TransactionResult { get; set; }
    }

    public class GetTransactionResult
    {
        public int TotalPages { get; set; }
        public Transactions Transactions { get; set; }
    }

    public class Transactions
    {
        [JsonConverter(typeof(Utility.SingleOrArrayConverter<Transaction>))]
        public List<Transaction> Transaction { get; set; }
    }

    public class Transaction
    {
        public int AccountID { get; set; }
        public string AccountTypeCode { get; set; }
         public decimal Balance { get; set; }
        public string BillNumber { get; set; }
        public BillingValue BillingValue { get; set; }
        public string Description { get; set; }
        public TransactionDetailValue DetailValue { get; set; }
        public InvoiceValue InvoiceValue { get; set; }
        public string IsReadOnly { get; set; }
        public string ItemNumber { get; set; }
        public string PolicyID { get; set; }
        public string PolicyTypeCode { get; set; }
        public decimal TransactionAmount { get; set; }
        public string TransactionCode { get; set; }
        public int TransactionID { get; set; }

       
       }

    public class Option
    {
        public string OptionName { get; set; }
        public int Value { get; set; }
    }

    
    public class BillingValue
    {
        public string ARDueDate { get; set; }
        public string AccountingMonth { get; set; }
        public string AgencyCode { get; set; }
        public Option BillingModeOption { get; set; }
        public string BranchCode { get; set; }
        public string DepartmentCode { get; set; }
        public DateTime EffectiveDate { get; set; }
        public DateTime GenerateInvoiceDate { get; set; }
        public int ProductionMonth { get; set; }
        public string ProfitCenterCode { get; set; }
        public object Reason { get; set; }
        public object ReasonDetails { get; set; }
        public object GeneralLedgerAccount { get; set; }
    }

    public class TransactionDetailValue
    {
        public decimal Balance { get; set; }
        public TransactionDetailItemsValue DetailItemsValue { get; set; }
    }

    public class TransactionDetailItemsValue
    {
        [JsonConverter(typeof(Utility.SingleOrArrayConverter<TransactionDetailItem>))]

        public List<TransactionDetailItem> DetailItem { get; set; }
    }

    public class TransactionDetailItem
    {
        public string ARDueDate { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string TransactionCode { get; set; }
        public int TransactionDetailNumber { get; set; }
    }

    public class InvoiceValue
    {
        public SendInvoiceTos SendInvoiceTos { get; set; }
    }

    public class SendInvoiceTos
    {
        public SendInvoiceToItem SendInvoiceToItem { get; set; }
    }

    public class SendInvoiceToItem
    {
        public string AccountLookupCode { get; set; }
        public string GenerateInvoice { get; set; }
        public object InvoiceMessage { get; set; }
        public int InvoiceNumber { get; set; }
        
    }

   


}
