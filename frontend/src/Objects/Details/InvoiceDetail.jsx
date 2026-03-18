import Detail from "../Detail";
import { useState } from "react";
import { FormatCurrency, fetchWithAuth } from "../../Utilities";
import { NewInvoice } from "../NewInvoice";
import { PdfViewer } from "../PdfViewer";
import { ConfirmationModal } from "../ConfimationModal";
import { useSuccessModal } from "../SuccessModal";

export function InvoiceDetail({ invoice, onClose, onSaved }) {
    const [showEdit, setShowEdit] = useState(false);
    const [pdfUrl,   setPdfUrl]   = useState(null);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const { showSuccess, SuccessModal } = useSuccessModal();

    const viewInvoicePdf = async () => {
        setLoadingPdf(true);
        try {
            const result = await fetchWithAuth("generate-invoice-pdf", { InvoiceId: invoice.Id });
            if (result?.Url) setPdfUrl(result.Url);
        } catch (e) { console.error(e); }
        setLoadingPdf(false);
    };

    const grandTotal = (invoice.LineItems ?? []).reduce((s, x) => s + (Number(x.amount ?? x.Amount) || 0), 0);

    const body = () => (
        <>
            {showEdit && (
                <NewInvoice
                    invoice={invoice}
                    Close={() => setShowEdit(false)}
                    OnSuccess={() => {
                        setShowEdit(false);
                        showSuccess("Invoice updated successfully");
                        onSaved?.();
                    }}
                />
            )}

            {pdfUrl && (
                <ConfirmationModal onClose={() => setPdfUrl(null)} maxWidth="900px" showButton={false}>
                    <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 15 }}>Invoice Preview</div>
                    <PdfViewer fileUrl={pdfUrl} />
                </ConfirmationModal>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                    title="Edit"
                    style={{ width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
                    onClick={() => setShowEdit(true)}
                >
                    ✎
                </button>
                <button
                    onClick={viewInvoicePdf}
                    disabled={loadingPdf}
                    style={{ padding: "8px 16px", background: "#fff", color: "#148dc2", border: "1px solid #148dc2", borderRadius: 6, cursor: loadingPdf ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                >
                    {loadingPdf ? "Loading…" : "View Invoice"}
                </button>
            </div>

            {/* Invoice Info */}
            <div className="trd-section">
                <h3 className="trd-section-title">Invoice Information</h3>
                <div className="trd-info-grid">
                    <div className="trd-info-row"><span className="trd-label">Invoice #:</span><span className="trd-value">{invoice.Id?.replace("Invoice#", "")}</span></div>
                    <div className="trd-info-row"><span className="trd-label">Created:</span><span className="trd-value">{invoice.DateCreated ? new Date(invoice.DateCreated).toLocaleDateString("en-US") : "—"}</span></div>
                    <div className="trd-info-row"><span className="trd-label">Last Updated:</span><span className="trd-value">{invoice.DateUpdated ? new Date(invoice.DateUpdated).toLocaleDateString("en-US") : "—"}</span></div>
                </div>
            </div>

            {/* Policy Info */}
            <div className="trd-section">
                <h3 className="trd-section-title">Policy Information</h3>
                <div className="trd-info-grid">
                    <div className="trd-info-row"><span className="trd-label">Policy #:</span><span className="trd-value">{invoice.PolicyNumber || "—"}</span></div>
                    <div className="trd-info-row"><span className="trd-label">Insured:</span><span className="trd-value">{invoice.InsuredName || "—"}</span></div>
                    <div className="trd-info-row"><span className="trd-label">Email:</span><span className="trd-value">{invoice.InsuredEmail || "—"}</span></div>
                    <div className="trd-info-row"><span className="trd-label">Carrier:</span><span className="trd-value">{invoice.CarrierName || "—"}</span></div>
                    <div className="trd-info-row"><span className="trd-label">Policy Start:</span><span className="trd-value">{invoice.PolicyStartDate || "—"}</span></div>
                    <div className="trd-info-row"><span className="trd-label">Policy End:</span><span className="trd-value">{invoice.PolicyEndDate || "—"}</span></div>
                    {invoice.PolicyDescription && (
                        <div className="trd-info-row"><span className="trd-label">Description:</span><span className="trd-value">{invoice.PolicyDescription}</span></div>
                    )}
                </div>
            </div>

            {/* Line Items */}
            {(invoice.LineItems?.length > 0) && (
                <div className="trd-section">
                    <h3 className="trd-section-title">Line Items</h3>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: "#f5f7fa" }}>
                                <th style={thStyle}>Type</th>
                                <th style={thStyle}>Description</th>
                                <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.LineItems.map((item, i) => (
                                <tr key={item.id ?? i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                    <td style={tdStyle}>
                                        <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, ...typeBadge(item.type ?? item.Type) }}>
                                            {item.type ?? item.Type}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>{item.description ?? item.Description}</td>
                                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 500 }}>{FormatCurrency(item.amount ?? item.Amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ borderTop: "2px solid #e5e7eb" }}>
                                <td colSpan={2} style={{ padding: "8px 10px", fontWeight: 700, color: "#333" }}>Total</td>
                                <td style={{ padding: "8px 10px", fontWeight: 700, color: "#148dc2", textAlign: "right" }}>{FormatCurrency(grandTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Finance Quote */}
            {invoice.AttachedFinanceQuote && (
                <div className="trd-section">
                    <h3 className="trd-section-title">Financing</h3>
                    <div className="trd-info-grid">
                        <div className="trd-info-row"><span className="trd-label">Company:</span><span className="trd-value">{invoice.AttachedFinanceQuote.Company ?? invoice.AttachedFinanceQuote.company}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Down Payment:</span><span className="trd-value">{FormatCurrency(invoice.AttachedFinanceQuote.DownPaymentAmount ?? invoice.AttachedFinanceQuote.downPaymentAmount)} ({invoice.AttachedFinanceQuote.DownPaymentPercent ?? invoice.AttachedFinanceQuote.downPaymentPercent}%)</span></div>
                        <div className="trd-info-row"><span className="trd-label">Amount Financed:</span><span className="trd-value">{FormatCurrency(invoice.AttachedFinanceQuote.AmountFinanced ?? invoice.AttachedFinanceQuote.amountFinanced)}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Monthly Payment:</span><span className="trd-value" style={{ fontWeight: 700, color: "#148dc2" }}>{FormatCurrency(invoice.AttachedFinanceQuote.MonthlyPayment ?? invoice.AttachedFinanceQuote.monthlyPayment)}</span></div>
                        <div className="trd-info-row"><span className="trd-label">APR:</span><span className="trd-value">{invoice.AttachedFinanceQuote.APR ?? invoice.AttachedFinanceQuote.apr}%</span></div>
                        <div className="trd-info-row"><span className="trd-label">Term:</span><span className="trd-value">{invoice.AttachedFinanceQuote.Term ?? invoice.AttachedFinanceQuote.term} months</span></div>
                        <div className="trd-info-row"><span className="trd-label">Total:</span><span className="trd-value">{FormatCurrency(invoice.AttachedFinanceQuote.TotalAmount ?? invoice.AttachedFinanceQuote.totalAmount)}</span></div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <>
            <SuccessModal />
            <Detail title="Invoice Detail" body={body()} onClose={onClose} />
        </>
    );
}

const thStyle = { padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #e5e7eb" };
const tdStyle = { padding: "6px 10px" };

function typeBadge(type) {
    if (type === "premium") return { background: "#dbeafe", color: "#1d4ed8" };
    if (type === "tax")     return { background: "#fef3c7", color: "#92400e" };
    return                         { background: "#ede9fe", color: "#6d28d9" };
}
