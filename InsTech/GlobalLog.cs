using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InsTech
{
   public class GlobalLog
    {
        private  string _log = "";
        public  void AddToLog(string message)
        {
           _log += message + Environment.NewLine;
        }
        public  string GetLog()
        {
            return _log;
        }
    }
}
