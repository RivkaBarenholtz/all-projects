using InsTechClassesV2.TransactionRequests;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.ComponentModel;
using System.Threading.Tasks;

namespace InsTechClassesV2
{
    public class PdfReceiptGenerator
    {
        public static async Task<byte[]> DownloadImage(string imageUrl)
        {
            using var client = new HttpClient();
            return await client.GetByteArrayAsync(imageUrl);
        }
        public static async Task<byte[]> GenerateReceipt(Cardknox.CardknoxReportItem data, string refNum, string? notes)
        {
            QuestPDF.Settings.License = LicenseType.Community;
            byte[] logoBytes = await  DownloadImage("https://insure-tech-vendor-data.s3.us-east-1.amazonaws.com/logos/InsureTech360.png");

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Element(c => ComposeHeader(c, logoBytes));
                    page.Content().Element(content => ComposeContent(content, data, refNum, notes));
                    page.Footer().AlignCenter().Text(text =>
                    {
                        text.Span("Page ");
                        text.CurrentPageNumber();
                        text.Span(" of ");
                        text.TotalPages();
                    });
                });
            });

            return document.GeneratePdf();
        }

        static void ComposeHeader(QuestPDF.Infrastructure.IContainer container, byte[] logoBytes)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("PAYMENT RECEIPT").FontSize(20).Bold().FontColor("#148dc2");
                    column.Item().Text($"Date: {DateTime.Now:MM/dd/yyyy}").FontSize(10);
                });

                row.ConstantItem(200).Height(100).Image(logoBytes);
            });
        }

       static void ComposeContent(QuestPDF.Infrastructure.IContainer container, Cardknox.CardknoxReportItem data, string refNum, string? notes)
        {
            container.PaddingVertical(20).Column(column =>
            {
                column.Spacing(15);

                // Transaction Summary
                column.Item().Element(c => ComposeSection(c, "Transaction Summary", new[]
                {
                ("Transaction ID", refNum),
                ("Payment Date", Convert.ToDateTime(data.EnteredDate).ToString("MM/dd/yyyy")),
               // ("Status", data.Status),
                ("Amount Paid", $"${data.Amount:N2}")
                }));

                // Policy Details
                column.Item().Element(c => ComposeSection(c, "Policy Details", new[]
                {
                ("Account ID", data.BillLastName),
                ("Invoice Number", data.Invoice),
                ("Notes", notes ?? "N/A")
                }));

                // Billing Information
                column.Item().Element(c => ComposeSection(c, "Billing Information", new[]
                {
                ("Cardholder Name", $"{data.Name}"),
                ("Billing Address", data.Street),
                ("City, State ZIP", $"{data.BillCity}, {data.BillState} {data.Zip}"),
                ("Phone", data.Phone),
                ("Email", data.Email)
                }));

                // Payment Method
                column.Item().Element(c => ComposeSection(c, "Payment Method", new[]
                {
                ("Method",  data.Command.StartsWith("CC")? "Credit Card": data.Command.StartsWith("Check")?"Check": "Send Wire"),
                ("Card/Check Number", data.MaskedAccountNumber),
                ("Expiration Date", data.Expiration)
                }));

               
            });
        }

      static  void ComposeSection(QuestPDF.Infrastructure.IContainer container, string title, (string Label, string Value)[] fields)
        {
            container.Column(column =>
            {
                column.Item().Text(title).FontSize(14).Bold().FontColor("#148dc2");
                column.Item().PaddingTop(5).PaddingBottom(10).BorderBottom(1).BorderColor(Colors.Grey.Lighten3);

                foreach (var (label, value) in fields)
                {
                    column.Item().PaddingTop(5).Row(row =>
                    {
                        row.ConstantItem(150).Text(label + ":").Bold();
                        row.RelativeItem().Text(value ?? "");
                    });
                }
            });
        }
    }
}