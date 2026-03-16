using AmazonUtilities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace InsTechClassesV2.ESign
{
    public class ESignService
    {
        public static async Task<byte[]> GenerateCertificate(ESignRequest request, Vendor vendor)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            byte[]? logoBytes = null;
            try
            {
                using var client = new HttpClient();
                logoBytes = await client.GetByteArrayAsync(
                    "https://insure-tech-vendor-data.s3.us-east-1.amazonaws.com/logos/InsureTech360.png");
            }
            catch { }

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(header =>
                    {
                        header.PaddingBottom(10).BorderBottom(2).BorderColor("#148dc2").Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text("CERTIFICATE OF COMPLETION").FontSize(20).Bold().FontColor("#148dc2");
                                col.Item().Text("Electronic Signature Record").FontSize(11).FontColor("#666666");
                                col.Item().PaddingTop(4).Text($"Transaction ID: {request.Id}").FontSize(9).FontColor("#999999");
                            });
                            if (logoBytes != null)
                                row.ConstantItem(140).Height(70).Image(logoBytes);
                        });
                    });

                    page.Content().PaddingTop(20).Column(col =>
                    {
                        col.Spacing(18);

                        col.Item().Element(c => RenderSection(c, "Document Information", new[]
                        {
                            ("Policy Number", request.PolicyCode),
                            ("Signed For", vendor.CompanyName ?? ""),
                            ("Date Completed", FormatDate(DateTime.UtcNow.ToString("o"))),
                            ("Original Document Hash (SHA-256)", request.DocumentHash),
                        }));

                        col.Item().Column(signerCol =>
                        {
                            signerCol.Item().Text("Signers").FontSize(13).Bold().FontColor("#148dc2");
                            signerCol.Item().PaddingTop(2).PaddingBottom(6).BorderBottom(1).BorderColor(Colors.Grey.Lighten3);

                            foreach (var party in request.Parties)
                            {
                                signerCol.Item().PaddingTop(12).Row(row =>
                                {
                                    row.RelativeItem().Column(inner =>
                                    {
                                        inner.Item().Text($"{party.Name}  ({party.Role})").Bold();
                                        if (!string.IsNullOrEmpty(party.Email))
                                            inner.Item().PaddingTop(2).Text(party.Email).FontColor("#666666");
                                        inner.Item().PaddingTop(4).Text($"Status: {party.Status}").FontColor(
                                            party.Status == "Signed" ? "#16a34a" : "#dc2626");

                                        if (party.Status == "Signed")
                                        {
                                            inner.Item().PaddingTop(2).Text($"Signed at: {FormatDate(party.SignedAt ?? "")}");
                                            inner.Item().Text($"IP Address: {party.IPAddress ?? "N/A"}");
                                            inner.Item().Text($"Method: {party.SignatureType ?? "Drawn"}");
                                        }
                                    });

                                    if (party.Status == "Signed" && !string.IsNullOrEmpty(party.SignatureData))
                                    {
                                        try
                                        {
                                            var cleaned = party.SignatureData
                                                .Replace("data:image/png;base64,", "")
                                                .Replace("data:image/jpeg;base64,", "");
                                            var sigBytes = Convert.FromBase64String(cleaned);
                                            row.ConstantItem(200).Height(70).Padding(4)
                                                .Border(1).BorderColor(Colors.Grey.Lighten2)
                                                .Image(sigBytes).FitArea();
                                        }
                                        catch { }
                                    }
                                });
                            }
                        });

                        col.Item().Column(auditCol =>
                        {
                            auditCol.Item().Text("Audit Trail").FontSize(13).Bold().FontColor("#148dc2");
                            auditCol.Item().PaddingTop(2).PaddingBottom(6).BorderBottom(1).BorderColor(Colors.Grey.Lighten3);

                            foreach (var ev in request.AuditEvents)
                            {
                                auditCol.Item().PaddingTop(6).Row(row =>
                                {
                                    row.ConstantItem(175).Text(FormatDate(ev.Timestamp)).FontColor("#888888");
                                    row.ConstantItem(110).Text(ev.EventType).Bold();
                                    row.RelativeItem().Text(ev.Metadata ?? "").FontColor("#555555");
                                });
                            }
                        });

                        col.Item().Background(Colors.Grey.Lighten4).Padding(12).Text(
                            "This certificate constitutes legally binding proof of electronic signature under the Electronic Signatures " +
                            "in Global and National Commerce Act (ESIGN, 15 U.S.C. § 7001) and the Uniform Electronic Transactions Act (UETA). " +
                            "The SHA-256 document hash above provides cryptographic proof of document integrity at time of signing."
                        ).FontSize(8).FontColor("#555555").Italic();
                    });

                    page.Footer().PaddingTop(8).BorderTop(1).BorderColor(Colors.Grey.Lighten3).Row(row =>
                    {
                        row.RelativeItem().Text($"Generated by InsTech 360  •  {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC")
                            .FontSize(8).FontColor("#aaaaaa");
                        row.AutoItem().Text(text =>
                        {
                            text.Span("Page ").FontSize(8).FontColor("#aaaaaa");
                            text.CurrentPageNumber().FontSize(8).FontColor("#aaaaaa");
                            text.Span(" of ").FontSize(8).FontColor("#aaaaaa");
                            text.TotalPages().FontSize(8).FontColor("#aaaaaa");
                        });
                    });
                });
            });

            return document.GeneratePdf();
        }

        private static void RenderSection(QuestPDF.Infrastructure.IContainer container, string title, (string Label, string Value)[] fields)
        {
            container.Column(col =>
            {
                col.Item().Text(title).FontSize(13).Bold().FontColor("#148dc2");
                col.Item().PaddingTop(3).PaddingBottom(8).BorderBottom(1).BorderColor(Colors.Grey.Lighten3);
                foreach (var (label, value) in fields)
                {
                    col.Item().PaddingTop(5).Row(row =>
                    {
                        row.ConstantItem(210).Text(label + ":").Bold();
                        row.RelativeItem().Text(value ?? "").FontSize(9);
                    });
                }
            });
        }

        private static string FormatDate(string iso)
        {
            if (DateTime.TryParse(iso, out var dt))
                return dt.ToUniversalTime().ToString("MMM dd, yyyy HH:mm:ss") + " UTC";
            return iso;
        }
    }
}
