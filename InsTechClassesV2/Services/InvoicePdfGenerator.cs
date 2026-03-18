using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;

namespace InsTechClassesV2.Services
{
    public class InvoicePdfGenerator
    {
        private static readonly CultureInfo USD = CultureInfo.GetCultureInfo("en-US");

        public static async Task<byte[]> Generate(Invoice invoice, Vendor vendor)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            byte[]? logoBytes = null;
            var logoUrl = vendor.PaymentSiteSettings?.LogoUrl;
            if (!string.IsNullOrEmpty(logoUrl))
            {
                try
                {
                    using var http = new HttpClient();
                    logoBytes = await http.GetByteArrayAsync(logoUrl);
                }
                catch { }
            }

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.Letter);
                    page.Margin(2, Unit.Centimetre);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                    page.Header().Element(c => Header(c, logoBytes, vendor));
                    page.Content().Element(c => Content(c, invoice));
                    page.Footer().AlignCenter().Text(t =>
                    {
                        t.Span("Page "); t.CurrentPageNumber(); t.Span(" of "); t.TotalPages();
                    });
                });
            }).GeneratePdf();
        }

        public static Task<byte[]> Generate(Policy policy, Vendor vendor)
        {
            var insuredName = policy.Customer != null
                ? ($"{policy.Customer.BillFirstName ?? ""} {policy.Customer.BillLastName ?? ""}".Trim()
                    is var n && !string.IsNullOrWhiteSpace(n) ? n : policy.Customer.BillCompany ?? "")
                : "";

            var invoice = new Invoice
            {
                Id              = policy.Id,
                DateCreated     = policy.DateCreated ?? DateTime.UtcNow.ToString("o"),
                InsuredName     = insuredName,
                InsuredEmail    = policy.Customer?.Email ?? "",
                PolicyNumber    = policy.PolicyCode,
                CarrierName     = policy.CarrierName,
                PolicyStartDate = policy.PolicyStartDate?.ToString("MM/dd/yyyy"),
                PolicyEndDate   = policy.PolicyEndDate?.ToString("MM/dd/yyyy"),
                PolicyDescription = policy.PolicyDescription,
                LineItems       = policy.LineItems ?? new(),
                ShowLineItems   = policy.ShowLineItems,
                AttachedFinanceQuote = policy.AttachedFinanceQuote,
            };
            return Generate(invoice, vendor);
        }

        static void Header(IContainer container, byte[]? logoBytes, Vendor vendor)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("INVOICE").FontSize(24).Bold().FontColor("#148dc2");
                    col.Item().PaddingTop(10).Text(vendor.CompanyName ?? "").FontSize(11).Bold();
                    if (!string.IsNullOrEmpty(vendor.CompanyAddress))
                        col.Item().Text(vendor.CompanyAddress).FontSize(10);
                    if (!string.IsNullOrEmpty(vendor.CompanyCityStateZip))
                        col.Item().Text(vendor.CompanyCityStateZip).FontSize(10);
                    if (!string.IsNullOrEmpty(vendor.CompanyPhone))
                        col.Item().Text(vendor.CompanyPhone).FontSize(10);
                    if (!string.IsNullOrEmpty(vendor.CompanyEmail))
                        col.Item().Text(vendor.CompanyEmail).FontSize(10);
                });

                if (logoBytes != null)
                    row.ConstantItem(180).Height(80).AlignRight().Image(logoBytes).FitUnproportionally();
            });
        }

        static void Content(IContainer container, Invoice invoice)
        {
            container.PaddingTop(20).Column(col =>
            {
                col.Spacing(18);

                // Date / Invoice #
                col.Item().Row(row =>
                {
                    row.RelativeItem().Text($"Invoice #: {invoice.Id?.Replace("Invoice#", "") ?? ""}").FontSize(10);
                    row.AutoItem().AlignRight().Text($"Date: {FormatDate(invoice.DateCreated ?? DateTime.UtcNow.ToString("o"))}").FontSize(10);
                });

                col.Item().LineHorizontal(1).LineColor("#e5e7eb");

                // Bill To
                col.Item().Column(c =>
                {
                    c.Item().Text("BILL TO").FontSize(9).Bold().FontColor("#888");
                    c.Item().PaddingTop(4).Text(invoice.InsuredName ?? "").FontSize(11).Bold();
                    if (!string.IsNullOrEmpty(invoice.InsuredEmail))
                        c.Item().Text(invoice.InsuredEmail).FontSize(10);
                });

                // Policy Info
                col.Item().Column(c =>
                {
                    c.Item().PaddingBottom(4).Text("POLICY INFORMATION").FontSize(9).Bold().FontColor("#888");
                    c.Item().Grid(grid =>
                    {
                        grid.Columns(2);
                        grid.Spacing(6);
                        void F(string label, string? value)
                        {
                            if (!string.IsNullOrWhiteSpace(value))
                                grid.Item().Text(t => { t.Span($"{label}: ").Bold().FontSize(10); t.Span(value).FontSize(10); });
                        }
                        F("Policy #", invoice.PolicyNumber);
                        F("Carrier", invoice.CarrierName);
                        F("Effective Date", invoice.PolicyStartDate);
                        F("Expiration Date", invoice.PolicyEndDate);
                        if (!string.IsNullOrWhiteSpace(invoice.PolicyDescription))
                            F("Description", invoice.PolicyDescription);
                    });
                });

                // Line Items or just Total
                var items = invoice.LineItems ?? new List<InvoiceLineItem>();
                decimal grandTotal = items.Sum(x => x.Amount);

                if (invoice.ShowLineItems && items.Count > 0)
                {
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(5);
                            cols.RelativeColumn(2);
                        });

                        table.Header(h =>
                        {
                            void HCell(string text) =>
                                h.Cell().Background("#f5f7fa").Padding(7).Text(text).Bold().FontSize(9);
                            HCell("Type");
                            HCell("Description");
                            h.Cell().Background("#f5f7fa").Padding(7).AlignRight().Text("Amount").Bold().FontSize(9);
                        });

                        foreach (var item in items)
                        {
                            void BCell(string text) =>
                                table.Cell().BorderBottom(1).BorderColor("#f0f0f0").Padding(7).Text(text).FontSize(9);
                            BCell(item.Type ?? "");
                            BCell(item.Description ?? "");
                            table.Cell().BorderBottom(1).BorderColor("#f0f0f0").Padding(7).AlignRight()
                                .Text(item.Amount.ToString("C", USD)).FontSize(9);
                        }

                        // Total row
                        table.Cell().ColumnSpan(2).BorderTop(2).BorderColor("#e5e7eb").Padding(7)
                            .Text("Total").Bold().FontSize(11);
                        table.Cell().BorderTop(2).BorderColor("#e5e7eb").Padding(7).AlignRight()
                            .Text(grandTotal.ToString("C", USD)).Bold().FontSize(11).FontColor("#148dc2");
                    });
                }
                else
                {
                    col.Item().AlignRight().Text(t =>
                    {
                        t.Span("Total: ").Bold().FontSize(13);
                        t.Span(grandTotal.ToString("C", USD)).Bold().FontSize(13).FontColor("#148dc2");
                    });
                }

                // Finance Quote
                if (invoice.AttachedFinanceQuote is { } q)
                {
                    col.Item().Background("#f0f9ff").Padding(12).Column(c =>
                    {
                        c.Item().Text("FINANCING").FontSize(9).Bold().FontColor("#888");
                        c.Item().PaddingTop(4).Text(q.Company ?? "").Bold().FontSize(10).FontColor("#148dc2");
                        c.Item().PaddingTop(6).Grid(grid =>
                        {
                            grid.Columns(2);
                            grid.Spacing(6);
                            void F(string label, string value) =>
                                grid.Item().Text(t => { t.Span($"{label}: ").Bold().FontSize(9); t.Span(value).FontSize(9);  });
                            F("Down Payment", $"{q.DownPaymentAmount.ToString("C", USD)} ({q.DownPaymentPercent}%)");
                            F("Amount Financed", q.AmountFinanced.ToString("C", USD));
                            F("Monthly Payment", q.MonthlyPayment.ToString("C", USD));
                            F("APR", $"{q.APR}%");
                            F("Term", $"{q.Term} months");
                            F("Total Financed", q.TotalAmount.ToString("C", USD));
                        });
                    });
                }
            });
        }

        static string FormatDate(string iso)
        {
            if (DateTime.TryParse(iso, out var d)) return d.ToString("MM/dd/yyyy");
            return iso;
        }
    }
}
