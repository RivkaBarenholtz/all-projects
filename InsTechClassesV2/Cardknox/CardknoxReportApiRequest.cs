using Amazon.SecretsManager.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.Cardknox
{
    public class CardknoxReportApiRequest :CardknoxApiRequest
    {
        public override string xCommand { get; set; } = "Report:All";
        protected override string path { get; set; } = "reportjson";

        public string xBeginDate { get; set; }
        public string xEndDate { get; set; }
        public Boolean xGetNewest { get; set; } = true;
        public int xMaxRecords { get; set; } = 1000;
        public string xFields { get; set; } = "xErrorCode,xCardLastFour,xAchReturnFee,xCardType,xBillLastName,xCommand,xEmail,xCustom02,xCustom03,xEnteredDate,xMaskedCardNumber,xName,xRefNum,xRequestAmount,xResponseResult,xStatus,xToken,xCustom09,xCustom10,xAmount,xInvoice";
    }
}
