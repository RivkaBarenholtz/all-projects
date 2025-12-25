
using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


namespace InsTechClassesV2.Utility
{
    public class SingleOrArrayConverter<T> : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return (objectType == typeof(List<T>));
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            JToken token = JToken.Load(reader);
            if (token.Type == JTokenType.Array)
            {
                // Deserialize directly from the token
                return token.ToObject<List<T>>(serializer);
            }
            else if (token.Type == JTokenType.Object)
            {
                // Wrap the single object in a list
                var singleItem = token.ToObject<T>(serializer);
                return new List<T> { singleItem };
            }

            return new List<T>();
        }


        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            serializer.Serialize(writer, value);
        }
    }
}
