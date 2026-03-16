using iText.IO.Image;
using iText.Kernel.Font;
using iText.Kernel.Geom;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas;

namespace InsTechClassesV2.ESign
{
    public class PdfSigningService
    {
        /// <summary>
        /// Embeds a signature image and date text into a PDF at the positions specified by the fields.
        /// Coordinates are stored as normalized fractions (0–1) from the top-left of the page.
        /// iText7 uses bottom-left origin, so Y is converted here.
        /// </summary>
        public static byte[] EmbedSignatures(
            byte[] originalPdfBytes,
            List<PolicySignatureField> fields,
            string signatureDataUrl,        // base64 data URL: "data:image/png;base64,..."
            string signerName,
            DateTime signedAt)
        {
            using var inputStream = new MemoryStream(originalPdfBytes);
            using var outputStream = new MemoryStream();

            var reader = new PdfReader(inputStream);
            var writer = new PdfWriter(outputStream);
            var pdfDoc = new PdfDocument(reader, writer);

            var font = PdfFontFactory.CreateFont(iText.IO.Font.Constants.StandardFonts.HELVETICA);

            // Parse signature image once
            byte[]? sigBytes = null;
            if (!string.IsNullOrEmpty(signatureDataUrl))
            {
                var base64 = signatureDataUrl
                    .Replace("data:image/png;base64,", "")
                    .Replace("data:image/jpeg;base64,", "");
                sigBytes = Convert.FromBase64String(base64);
            }

            string dateText = signedAt.ToString("MM/dd/yyyy");

            foreach (var field in fields)
            {
                var pdfPage = pdfDoc.GetPage(field.Page);
                var pageSize = pdfPage.GetPageSize();
                float pageWidth = pageSize.GetWidth();
                float pageHeight = pageSize.GetHeight();

                float x = field.X * pageWidth;
                float fieldHeight = field.Height * pageHeight;
                float fieldWidth = field.Width * pageWidth;
                // Convert top-left Y → iText bottom-left Y
                float y = pageHeight - (field.Y * pageHeight) - fieldHeight;

                var canvas = new PdfCanvas(pdfPage);

                if (field.Type == "signature" && sigBytes != null)
                {
                    var imageData = ImageDataFactory.Create(sigBytes);
                    canvas.AddImageFittedIntoRectangle(
                        imageData,
                        new Rectangle(x, y, fieldWidth, fieldHeight),
                        false);
                }
                else if (field.Type == "date")
                {
                    float fontSize = Math.Min(fieldHeight * 0.55f, 12f);
                    canvas.BeginText()
                        .SetFontAndSize(font, fontSize)
                        .MoveText(x + 4, y + (fieldHeight - fontSize) / 2)
                        .ShowText(dateText)
                        .EndText();
                }

                canvas.Release();
            }

            pdfDoc.Close();
            return outputStream.ToArray();
        }
    }
}
