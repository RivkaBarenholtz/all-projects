namespace InsTechClassesV2.ESign
{
    public class PolicySignatureField
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Type { get; set; } = "signature"; // "signature" | "date"
        public int Page { get; set; } = 1;              // 1-based page number
        public float X { get; set; }                    // normalized 0-1, from left
        public float Y { get; set; }                    // normalized 0-1, from top
        public float Width { get; set; } = 0.25f;       // normalized 0-1
        public float Height { get; set; } = 0.06f;      // normalized 0-1
    }
}
