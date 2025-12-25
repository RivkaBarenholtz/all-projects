using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTech
{
   public class CardknoxTransactionReportResponse
    {
        [JsonProperty("xResult")]
        public string Result { get; set; }

        [JsonProperty("xStatus")]
        public string Status { get; set; }

        [JsonProperty("xError")]
        public string Error { get; set; }

        [JsonProperty("xRefNum")]
        public string RefNum { get; set; }

        [JsonProperty("xReportingMaxTransactions")]
        public string ReportingMaxTransactions { get; set; }

        [JsonProperty("xRecordsReturned")]
        public string RecordsReturned { get; set; }

        [JsonProperty("xReportData")]
        public List<CardknoxReportItem> ReportData { get; set; }
    }

    public class CardknoxReportItem
    {
        [JsonProperty("xSoftwareName")]
        public string SoftwareName { get; set; }

        [JsonProperty("xCommand")]
        public string Command { get; set; }

        [JsonProperty("xRefNum")]
        public string RefNum { get; set; }

        [JsonProperty("xResponseRefNum")]
        public string ResponseRefNum { get; set; }

        [JsonProperty("xRouting")]
        public string Routing { get; set; }

        [JsonProperty("xMaskedCardNumber")]
        public string MaskedCardNumber { get; set; }

        [JsonProperty("xIsTOR")]
        public string IsTOR { get; set; }

        [JsonProperty("xClientIP")]
        public string ClientIP { get; set; }

        [JsonProperty("xMaskedAccountNumber")]
        public string MaskedAccountNumber { get; set; }

        [JsonProperty("xCardLastFour")]
        public string CardLastFour { get; set; }

        [JsonProperty("xCardType")]
        public string CardType { get; set; }

        [JsonProperty("xCCType")]
        public string CCType { get; set; }

        [JsonProperty("xAccountType")]
        public string AccountType { get; set; }

        [JsonProperty("xToken")]
        public string Token { get; set; }

        [JsonProperty("xPaymentId")]
        public string PaymentId { get; set; }

        [JsonProperty("xName")]
        public string Name { get; set; }

        [JsonProperty("xComputerName")]
        public string ComputerName { get; set; }

        [JsonProperty("xUserName")]
        public string UserName { get; set; }

        [JsonProperty("xExp")]
        public string Expiration { get; set; }

        [JsonProperty("xAmount")]
        public string Amount { get; set; }

        [JsonProperty("xRequestAmount")]
        public string RequestAmount { get; set; }

        [JsonProperty("xSubtotal")]
        public string Subtotal { get; set; }

        [JsonProperty("xTax")]
        public string Tax { get; set; }

        [JsonProperty("xIP")]
        public string IP { get; set; }

        [JsonProperty("xInvoice")]
        public string Invoice { get; set; }

        [JsonProperty("xTerminalNum")]
        public string TerminalNum { get; set; }

        [JsonProperty("xStatus")]
        public string Status { get; set; }

        [JsonProperty("xBillLastName")]
        public string BillLastName { get; set; }

        [JsonProperty("xMerchantName")]
        public string MerchantName { get; set; }

        [JsonProperty("xMerchantStreet")]
        public string MerchantStreet { get; set; }

        [JsonProperty("xMerchantCity")]
        public string MerchantCity { get; set; }

        [JsonProperty("xMerchantState")]
        public string MerchantState { get; set; }

        [JsonProperty("xMerchantZip")]
        public string MerchantZip { get; set; }

        [JsonProperty("xMerchantPhone")]
        public string MerchantPhone { get; set; }

        [JsonProperty("xCustom02")]
        public string Custom02 { get; set; }

        [JsonProperty("xCustom03")]
        public string Custom03 { get; set; }

        [JsonProperty("xEnteredDate")]
        public string EnteredDate { get; set; }

        [JsonProperty("xResponseResult")]
        public string ResponseResult { get; set; }

        [JsonProperty("xResponseBatch")]
        public string ResponseBatch { get; set; }

        [JsonProperty("xResponseAVSCode")]
        public string ResponseAVSCode { get; set; }

        [JsonProperty("xResponseCVVCode")]
        public string ResponseCVVCode { get; set; }

        [JsonProperty("xResponseAuthCode")]
        public string ResponseAuthCode { get; set; }

        [JsonProperty("xGatewayResult")]
        public string GatewayResult { get; set; }

        [JsonProperty("xErrorCode")]
        public string ErrorCode { get; set; }

        [JsonProperty("xFraudResubmitted")]
        public string FraudResubmitted { get; set; }

        [JsonProperty("xProcessor")]
        public string Processor { get; set; }

        [JsonProperty("xIsEMV")]
        public string IsEMV { get; set; }

        [JsonProperty("xCVMResult")]
        public string CVMResult { get; set; }

        [JsonProperty("xEntryMethod")]
        public string EntryMethod { get; set; }

        [JsonProperty("xVersionApi")]
        public string VersionApi { get; set; }

        [JsonProperty("xSourceKey")]
        public string SourceKey { get; set; }

        [JsonProperty("xCardSource")]
        public string CardSource { get; set; }

        [JsonProperty("xAccountUpdateSource")]
        public string AccountUpdateSource { get; set; }

        [JsonProperty("xSplitAmount")]
        public string SplitAmount { get; set; }

        [JsonProperty("xProcessingFee")]
        public string ProcessingFee { get; set; }

        [JsonProperty("xIsInternational")]
        public string IsInternational { get; set; }

        [JsonProperty("xAchReturnFee")]
        public string AchReturnFee { get; set; }

        [JsonProperty("xServiceFee")]
        public string ServiceFee { get; set; }

        [JsonProperty("xRatePercentage")]
        public string RatePercentage { get; set; }

        [JsonProperty("xInternationalRatePercentage")]
        public string InternationalRatePercentage { get; set; }

        [JsonProperty("xRatePerItem")]
        public string RatePerItem { get; set; }

        [JsonProperty("xExternalTransactionID")]
        public string ExternalTransactionID { get; set; }

        [JsonProperty("xAutoReversed")]
        public string AutoReversed { get; set; }

        [JsonProperty("xIsSplitCapturable")]
        public string IsSplitCapturable { get; set; }

        [JsonProperty("xDigitalWalletType")]
        public string DigitalWalletType { get; set; }

        [JsonProperty("xCryptoProcessingFee")]
        public string CryptoProcessingFee { get; set; }

        [JsonProperty("xCryptoTransactionFee")]
        public string CryptoTransactionFee { get; set; }

        [JsonProperty("xCryptoNetworkFee")]
        public string CryptoNetworkFee { get; set; }

        [JsonProperty("xEwicModifiedItems")]
        public string EwicModifiedItems { get; set; }

        [JsonProperty("xAdditionalRefnum")]
        public string AdditionalRefnum { get; set; }

        [JsonProperty("xAdditionalAuthAmount")]
        public string AdditionalAuthAmount { get; set; }

        [JsonProperty("x3dsConsumerInteraction")]
        public string ConsumerInteraction3ds { get; set; }

        [JsonProperty("xTransferMerchantName")]
        public string TransferMerchantName { get; set; }

        [JsonProperty("xTransferMerchantId")]
        public string TransferMerchantId { get; set; }

        [JsonProperty("xIsFsa")]
        public string IsFsa { get; set; }

        [JsonProperty("xVoid")]
        public string Void { get; set; }

        [JsonProperty("xVoidable")]
        public string Voidable { get; set; }

        [JsonProperty("xECI")]
        public string Eci { get; set; }

        [JsonProperty("xCAVV")]
        public string Cavv { get; set; }
    }
}
