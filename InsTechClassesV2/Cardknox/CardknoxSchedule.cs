using Amazon.S3.Model;
using AmazonUtilities;
using InsTechClassesV2.Api;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.Cardknox
{
    public abstract class CardknoxSchedule
    {
        public async Task<HttpResponseMessage> PostToCardknox(Vendor vendor)
        {
            var Key = await SecretManager.GetSecret(vendor.CardknoxApiKeySecretName);
            //if (vendor.IsInstructional) Key = "ifmerchatest3f02d6c3925944798466adca90a4c77d";

            var response = await ApiClient.CallApiAsync($"https://api.cardknox.com/v2/{path}", HttpMethod.Post, new Dictionary<string, string>(), this, null, new Dictionary<string, string>() { { "Authorization", Key }, { "X-Recurring-Api-Version", "2.1" } });
            return response;
        }
        public string SoftwareName { get; set; } = "InsureTechTest";
        public string SoftwareVersion { get; set; } = "1.0";

        protected abstract string path { get; set; }
    }
    public class CardknoxNewCustomerApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "CreateCustomer";
        public string BillMobile { get; set; }
        public string BillPhone { get; set; }

        public string BillCountry { get; set; }
        public string BillZip { get; set; }
        public string BillState { get; set; }
        public string BillCity { get; set; }
        public string BillStreet { get; set; }
        public string BillCompany { get; set; }
        public string BillLastName { get; set; }
        public string BillMiddleName { get; set; }
        public string BillFirstName { get; set; }
        public string Fax { get; set; }
        public string Email { get; set; }
        public string CustomerNotes { get; set; }
        public string CustomerNumber { get; set; }


    }
    
    public class UpdatePaymentMethodApiRequest : NewPaymentMethodApiRequest
    {

        protected override string path { get; set; } = "UpdatePaymentMethod";
        public int Revision { get; set; }
        public string PaymentMethodId { get; set; }
    }
    public class CardknoxUpdateCustomerApiRequest : CardknoxNewCustomerApiRequest
    {
        protected override string path { get; set; } = "UpdateCustomer";
        public int Revision { get; set; }
        public string DefaultPaymentMethodId { get; set; }
        public string CustomerId { get; set; }
    }
    public class CardknoxUpdateScheduleRequest : CreateScheduleApiRequest
    {
        protected override string path { get; set; } = "UpdateSchedule";
       
        public int Revision { get; set; }
 
        public string ScheduleId { get; set; }
    }
    public class CardknoxListCustomerApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "ListCustomers";
        public int PageSize { get; set; }
        public string SortOrder { get; set; }
        public string NextToken { get; set; }
        public CustomerFilters Filters { get; set; }
    }

    public class CustomerFilters
    {
        public string CustomerId { get; set; }

        public string CustomerNumber { get; set; }

        public bool IsDeleted { get; set; }

        public string Email { get; set; }

        public string BillName { get; set; }

        public string BillFirstName { get; set; }

        public string BillLastName { get; set; }

        public string BillMiddleName { get; set; }

        public string BillCompany { get; set; }

        public string BillStreet { get; set; }

        public string BillStreet2 { get; set; }

        public string BillCity { get; set; }

        public string BillState { get; set; }

        public string BillZip { get; set; }

        public string BillCountry { get; set; }

        public string BillPhoneNumber { get; set; }

        public string BillPhone { get; set; }

        public string BillMobile { get; set; }

        public string BillFax { get; set; }
    }
    public class PaymentMethodApiResponse
    {
        public string RefNum { get; set; }
        public string Result { get; set; }
        public string Error { get; set; }
        public string PaymentMethodId { get; set; }
        public int Revision { get; set; }
        public string Token { get; set; }
        public string TokenType { get; set; }
        public string TokenAlias { get; set; }
        public string Exp { get; set; }
        public string AccountType { get; set; }
        public string Issuer { get; set; }
        public string MaskedCardNumber { get; set; }
        public string Name { get; set; }
        public string Street { get; set; }
        public string Zip { get; set; }
        public string CreatedDate { get; set; }
    }
    public class NewPaymentMethodApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "CreatePaymentMethod";
        public string CustomerId { get; set;  }
        public string Token { get; set; }
        public string TokenType { get; set; }
        public string TokenAlias { get; set; }
        public string Exp { get; set; }

        public string Routing { get; set; }
        public string Name { get; set; }
        public string AccountType { get; set; }
        public string Street { get; set; }
        public string Zip { get; set; }
        public Boolean? SetAsDefault { get; set; }
    }
    public class CardknoxGetPaymentMethodApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "GetPaymentMethod";
        public string PaymentMethodId { get; set; }
    }

    public class CardknoxDeletePaymentMethodApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "DeletePaymentMethod";
        public string PaymentMethodId { get; set; }
    }
    public class CardknoxListPaymentMethodApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "ListPaymentMethods";
        public int PageSize { get; set; }
        public string NextToken { get; set; }

        public string SortOrder { get; set; }
        public PaymentMethodFilters Filters { get; set; }   

    }

    public class PaymentMethodFilters
    {
        public string CustomerId { get; set; }
        public string PaymentMethodId { get; set; }
        public string Token { get; set; }

        public string TokenType { get; set; }
    }



    public class GetScheduleApiResponse
    {
        public string RefNum { get; set; }
        public string Result { get; set; }
        public string Error { get; set; }
        public string ScheduleId { get; set; }
        public int Revision { get; set; }
        public string CustomerId { get; set; }
        public string PaymentMethodId { get; set; }
        public int FailedTransactionRetryTimes { get; set; }
        public int DaysBetweenRetries { get; set; }
        public DateTime StartDate { get; set; }
        public decimal Amount { get; set; }
        public int TotalPayments { get; set; }
        public string IntervalType { get; set; }
        public int IntervalCount { get; set; }
        public DateTime LastProjectedPaymentDate { get; set; }
        public DateTime NextScheduledRunTime { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        public string CreationRefnum { get; set; }
        public string CalendarCulture { get; set; }
        public string AfterMaxRetriesAction { get; set; }
        public string BillFirstName { get; set; }
        public string BillLastName { get; set; }
        public string BillCompany { get; set; }
        public DateTime ModifiedDate { get; set; }
        public string ModifiedRefnum { get; set; }
        public PaymentMethodApiResponse PaymentMethod { get; set; }
    }


    public class GetScheduleApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "GetSchedule";
        public string ScheduleId { get; set; }
    }
     public class GetCustomerApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "GetCustomer";
        public string CustomerId { get; set; }
    }
    public class ListScheduleApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "ListSchedules";
        public string NextToken { get; set; }
        public int PageSize { get; set; } = 500;
        public string SortOrder { get; set; } = "Descending";

    }
    public class ScheduleApiResponse
    {
        public string RefNum { get; set; }
        public string Result { get; set; }
        public string Error { get; set; }
        public List<CreateScheduleApiRequest> Schedules { get; set; }
    }
    public class ScheduleFilters
    {
        public bool IsDeleted { get; set; }
        public string CustomerId { get; set; }
        public string ScheduleId { get; set; }
        public string ScheduleName { get; set; }
    }
    public class StopScheduleApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "DisableSchedule";
        public string ScheduleId { get; set;  }

    }
    public class DeleteScheduleApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "DeleteSchedule";
        public string ScheduleId { get; set; }

    }
    public class EnableScheduleApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "EnableSchedule";
        public string ScheduleId { get; set; }

    }
    public class CreateScheduleApiRequest : CardknoxSchedule
    {
        protected override string path { get; set; } = "CreateSchedule";
        public string ScheduleID { get; set; }
         public virtual string? CustomerId { get; set; }
        public string PaymentMethodId { get; set; }
        public CardknoxNewCustomerApiRequest NewCustomer { get; set; }
        public NewPaymentMethodApiRequest NewPaymentMethod { get; set; }
        public virtual string IntervalType { get; set; }
        public string Cvv { get; set; }
        public string Description { get; set; }
        public string Invoice { get; set; }

        public string ScheduleName { get; set; }
        public int? FailedTransactionRetryCount { get; set; }
        public virtual  int? PaymentsProcessed { get; set; }
        public int TotalPayments { get; set; }
        public decimal Amount { get; set; }
        public decimal? Subtotal { get; set; }
        public int? DaysBetweenRetries { get; set; }
        public virtual int? IntervalCount { get; set; }
        public Boolean SkipSaturdayAndHolidays { get; set; }
        public Boolean CustReceipt { get; set; }
        public string CalendarCulture { get; set; }

        public List<SplitInstructions> SplitInstruction { get; set; }
        public Boolean UseDefaultPaymentMethodOnly { get; set; }
        public string? StartDate { get; set; }
        public string EndDate { get; set; }
        public string AfterMaxRetriesAction { get; set; }
        public virtual Boolean? AllowInitialTransactionToDecline { get; set; }
        public virtual string? CreatedDate { get; set; }
        public virtual string? CustomerNumber { get; set; }
        public decimal? InitialAmount { get; set; }
    }

}
