using Newtonsoft.Json;

public class AgencyCode
{
}

public class ApplyRemainingBalanceToOption
{
    public string OptionName { get; set; }
    public int Value { get; set; }
}







public class ApplyToSelectedItemsApplyCreditsToDebits
{
    public AgencyCode AgencyCode { get; set; }
    public ApplyRemainingBalanceToOption ApplyRemainingBalanceToOption { get; set; }
    public string ApplyRemainingBalanceToPolicyIncludeHistory { get; set; }
    public int ApplyRemainingBalanceToPolicyLineID { get; set; }
    public Credits Credits { get; set; }
    public Debits Debits { get; set; }
}

public class BankSubAccountNumberCode
{
}

public class ResponseBody
{
    public GetGeneralLedgerReceiptResponse Get_GeneralLedger_ReceiptResponse { get; set; }
}


public class CashOnAccountOptions
{
    public string OptionName { get; set; }
    public int Value { get; set; }
}

public class Credits
{
    public List<CreditItem> CreditItem { get; set; }
}
public class CreditItem
{
    public int TransactionID { get; set; } = -1;
}
public class DebitCreditOption
{
    public string OptionName { get; set; }
    public int Value { get; set; }
}

public class Debits
{
    public List<DebitItem> DebitItem { get; set; }
}

public class DetailItem
{
    public decimal Amount { get; set; }
    public string ApplyTo { get; set; }
    public string ApplyToPolicyIncludeHistory { get; set; }
    public int ApplyToPolicyLineID { get; set; }
    public ApplyToSelectedItemsApplyCreditsToDebits ApplyToSelectedItemsApplyCreditsToDebits { get; set; }
    public DebitCreditOption DebitCreditOption { get; set; }
    public string Description { get; set; }
    public int DetailItemID { get; set; }
    public string Flag { get; set; }
    public int GeneralLedgerAccountNumberCode { get; set; }
    public bool IsBankAccount { get; set; }
    public Object PaymentDate { get; set; }

    public string StructureAgencyCode { get; set; }
    public string StructureBranchCode { get; set; }
   
    public CashOnAccountOptions CashOnAccountOptions { get; set; }
    public string DetailItemAccountLookupCode { get; set; }
}


public class DetailItemsValue
{
    public List<DetailItem> DetailItem { get; set; }
}

public class DetailValue
{
    public DetailItemsValue DetailItemsValue { get; set; } =  new DetailItemsValue();
    public decimal Total { get; set; }
}

public class Envelope
{
    public ResponseBody Body { get; set; }
}


public class GetGeneralLedgerReceiptResponse
{
    public GetGeneralLedgerReceiptResult Get_GeneralLedger_ReceiptResult { get; set; }
}

public class GetGeneralLedgerReceiptResult
{
    public Receipts Receipts { get; set; }
    public int TotalPages { get; set; }
}



public class ProcessOutstandingPaymentsValue
{
    public bool PaymentCreateTransmissionFile { get; set; }
    public bool PaymentNoTransmissionFile { get; set; }
    public bool ReceiptForPayment { get; set; }
    public bool UpdateAccountingMonthToMatchReceipt { get; set; }
}

public class Receipt
{
    public int BankAccountNumberCode { get; set; }
    public BankSubAccountNumberCode BankSubAccountNumberCode { get; set; }
    public DetailValue DetailValue { get; set; }
    public string FinalizedReceipt { get; set; }
    public string IsReadOnly { get; set; }
    public string ReceiptAccountingMonth { get; set; }
    public string ReceiptDescription { get; set; }
    public DateTime ReceiptEffectiveDate { get; set; }
    public int ReceiptID { get; set; }
    public string ReceiptReferNumber { get; set; }
    public bool SuspendedReceipt { get; set; }
    public DateTime Timestamp { get; set; }
    public bool IgnoreAccountingMonthVerification { get; set; }
    public ProcessOutstandingPaymentsValue ProcessOutstandingPaymentsValue { get; set; }
    
}

public class Receipts
{
    public Receipt Receipt { get; set; }
}

public class ReceiptFilterResponse
{
    public Envelope Envelope { get; set; }
}



public class DebitItem
{
        public int TransactionID { get; set; } = -1;
        public int InvoiceNumber { get; set; }
}
public class Ns4Wrapper
{
    [JsonProperty("ns4")]
    public Receipt Payload { get; set; }
}

