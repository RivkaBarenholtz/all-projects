using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.BoldSign
{
  public  class BoldSignWebhookEvent
    {
        public WebhookEvent Event { get; set; } 
        public WebhookEventData Data { get; set; }
    }

    public class WebhookEvent
    {
        public string EventType { get; set; }

    }
    public class  WebhookEventData 
    {
        public string DocumentId { get; set; }
    }
}
