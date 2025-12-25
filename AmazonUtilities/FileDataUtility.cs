using Amazon.Runtime;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Numerics;



namespace AmazonUtilities
{
  public static  class FileDataUtility
    {
        public static async Task<List<T>?> GetList<T>(string _bucketName , string _fileName)
        {
            AmzS3Bucket File = new AmzS3Bucket(_bucketName, _fileName);
            string fileContents = await File.ReadS3File();
            List<T>? list = Newtonsoft.Json.JsonConvert.DeserializeObject<List<T>>(fileContents);
            return list;
        }


    }
}
