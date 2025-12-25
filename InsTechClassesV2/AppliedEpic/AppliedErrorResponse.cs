using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTechClassesV2.AppliedEpic
{
    public class AppliedErrorResponse
    {
      public Envelope Envelope { get; set; }
    }


    public class Envelope
    {
        public Body Body { get; set; }
    }

    public class Body
    {
        public Fault Fault { get; set; }
    }

    public class Fault
    {
        public string faultcode { get; set; }
        public Faultstring faultstring { get; set; }
        public FaultDetail detail { get; set; }
    }

    public class Faultstring
    {
        [JsonProperty("lang")]
        public string Lang { get; set; }

        [JsonProperty("content")]
        public string Content { get; set; }
    }

    public class FaultDetail
    {
        public InputValidationFault InputValidationFault { get; set; }
    }

    public class InputValidationFault
    {
        public string Description { get; set; }
        public object ExceptionFile { get; set; }
        public string FieldName { get; set; }
        public string IsLengthExceededFault { get; set; }
        public object MaximumValueorLength { get; set; }
        public string MethodName { get; set; }
    }

}
