using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.Cardknox
{
    public class CardknoxDigitalWalletTransactionApiRequest: CardknoxTransactionApiRequest
    {
        public override string xCommand { get; set; } = "cc:sale";
        public string xDigitalWalletType { get; set; } = "GooglePay";

        public List<SplitInstructions> xSplitInstruction { get; set; }
        public string xCardNum { get; set; }
        public decimal xAmount { get; set; }
        
        public string xBillFirstName { get; set; }
        public string xBillStreet {  get; set; }
     
        public string xBillCity {  get; set; }
       
        public string xBillState { get; set; }
        
        public string xBillZip {  get; set; }
    }
}
