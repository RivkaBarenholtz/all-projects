using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
    public class SchedulePaymentMethod
    {
        public SchedulePaymentMethod(string scheduleID, string paymentMethodID) {
        this.PaymentMethodId = paymentMethodID;
            this.ScheduleId = scheduleID;
        }
        public string ScheduleId { get; set; }  
        public string PaymentMethodId { get; set; } 
    }
}
