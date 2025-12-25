namespace InsTechClassesV2.Services
{
    public class ConfirmWireRequest
    {
        public string RefNum { get; set; } 
    }

    public class VoidWireRequest
    {
        public string RefNum { get; set; }
    }
    public class RefundWireRequest
    {
        public string RefNum { get; set; }
        public decimal Amount { get; set; }
    }
}