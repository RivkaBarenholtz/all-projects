import { useState, useRef } from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { PolicySearch } from "./PolicySearch";
import { Policy } from "./NewPolicy";
import { PdfViewer } from "./PdfViewer";
import { fetchWithAuth, FormatCurrency } from "../Utilities";

const FINANCE_COMPANIES = [
  { name: "First Insurance Funding Corp (FIFC)", apr: 0.109,  downPct: 0.15, term: 10 },
  { name: "AFCO Credit Corporation",             apr: 0.125,  downPct: 0.20, term: 10 },
  { name: "Imperial Premium Finance",            apr: 0.1499, downPct: 0.25, term: 10 },
];

function calcQuote(premiumBase, company) {
  const { name, apr, downPct, term } = company;
  const down     = premiumBase * downPct;
  const financed = premiumBase - down;
  const r        = apr / 12;
  const monthly  = r === 0 ? financed / term : financed * r / (1 - Math.pow(1 + r, -term));
  return {
    company:            name,
    downPaymentPercent: downPct * 100,
    downPaymentAmount:  down,
    amountFinanced:     financed,
    monthlyPayment:     monthly,
    apr:                apr * 100,
    term,
    totalAmount:        down + monthly * term,
  };
}

export function NewInvoice({ Close, OnSuccess, invoice: editInvoice }) {
  const isEdit = !!editInvoice;

  const policyRef  = useRef(null);
  const [policyKey, setPolicyKey] = useState(0);
  const [selectedPolicy, setSelectedPolicy] = useState(() => {
    if (!editInvoice) return null;
    return {
      PolicyId:          editInvoice.PolicyId ?? null,
      PolicyCode:        editInvoice.PolicyNumber ?? "",
      PolicyDescription: editInvoice.PolicyDescription ?? "",
      CarrierName:       editInvoice.CarrierName ?? "",
      PolicyStartDate:   editInvoice.PolicyStartDate ?? "",
      PolicyEndDate:     editInvoice.PolicyEndDate ?? "",
      Customer: {
        Email:        editInvoice.InsuredEmail ?? "",
        BillFirstName: "",
        BillLastName:  "",
        BillCompany:   editInvoice.InsuredName ?? "",
      },
    };
  });
  const [linkedPolicyCode, setLinkedPolicyCode] = useState(editInvoice?.PolicyNumber ?? "");

  const [showPolicySearch, setShowPolicySearch] = useState(false);
  const [policyAmount, setPolicyAmount] = useState(Number(editInvoice?.PolicyAmount) || 0);

  const [lineItems, setLineItems] = useState(
    editInvoice?.LineItems?.length
      ? editInvoice.LineItems
      : [{ id: crypto.randomUUID(), type: "premium", description: "Policy Premium", amount: 0 }]
  );
  const [showLineItems, setShowLineItems] = useState(editInvoice?.ShowLineItems ?? true);

  const [quotes,          setQuotes]          = useState([]);
  const [quotesGenerated, setQuotesGenerated] = useState(false);
  const [attachedQuote,   setAttachedQuote]   = useState(editInvoice?.AttachedFinanceQuote ?? null);
  const [saving,          setSaving]          = useState(false);

  const handlePolicySelect = (p) => {
    setSelectedPolicy({ ...p, PolicyAmount: p.PolicyAmount ?? p.Amount ?? 0 });
    setPolicyKey(k => k + 1);
    setLinkedPolicyCode(p.PolicyCode ?? "");
    setLineItems(prev => [
      { id: crypto.randomUUID(), type: "premium", description: "Policy Premium", amount: p.Amount ?? 0 },
      ...prev.filter(x => x.type !== "premium"),
    ]);
    setShowPolicySearch(false);
  };

  const grandTotal = policyAmount + lineItems
    .filter(x => x.type !== "premium")
    .reduce((s, x) => s + (Number(x.amount) || 0), 0);

  const generateQuotes = () => {
    setQuotes(FINANCE_COMPANIES.map(c => calcQuote(policyAmount, c)));
    setQuotesGenerated(true);
  };

  const addLineItem = (type) =>
    setLineItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), type, description: type === "tax" ? "State Tax" : "Agency Fee", amount: 0 },
    ]);

  const updateLineItem = (id, field, value) =>
    setLineItems(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));

  const removeLineItem = (id) =>
    setLineItems(prev => prev.filter(x => x.id !== id));

  const [pdfUrl, setPdfUrl] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const pVals = policyRef.current?.getValues() ?? {};
      const cust  = pVals.Customer ?? {};
      const insuredName = `${cust.BillFirstName ?? ""} ${cust.BillLastName ?? ""}`.trim() || cust.BillCompany || "";
      const payload = {
        ...(editInvoice ?? {}),
        PolicyId:          pVals.PolicyId ?? null,
        PolicyNumber:      pVals.PolicyCode ?? "",
        InsuredName:       insuredName,
        InsuredEmail:      cust.Email ?? "",
        CarrierName:       pVals.CarrierName ?? "",
        PolicyStartDate:   pVals.PolicyStartDate ?? "",
        PolicyEndDate:     pVals.PolicyEndDate ?? "",
        PolicyDescription: pVals.PolicyDescription ?? "",
        LineItems:         [
          { id: lineItems.find(x => x.type === "premium")?.id ?? crypto.randomUUID(), type: "premium", description: "Policy Premium", amount: policyAmount },
          ...lineItems.filter(x => x.type !== "premium").map(x => ({ ...x, amount: Number(x.amount) || 0 })),
        ],
        ShowLineItems:     showLineItems,
        AttachedFinanceQuote: attachedQuote,
      };
      const result = await fetchWithAuth(isEdit ? "update-invoice" : "create-invoice", payload);
      const invoiceId = result?.Id ?? editInvoice?.Id;
      if (invoiceId) {
        const pdfResult = await fetchWithAuth("generate-invoice-pdf", { InvoiceId: invoiceId });
        if (pdfResult?.Url) { setPdfUrl(pdfResult.Url); setSaving(false); return; }
      }
      OnSuccess(result);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (pdfUrl) {
    return (
      <ConfirmationModal onClose={() => { OnSuccess(); setPdfUrl(null); }} maxWidth="900px" showButton={false}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Invoice Preview</span>
        </div>
        <PdfViewer fileUrl={pdfUrl} />
      </ConfirmationModal>
    );
  }

  return (
    <>
      <ConfirmationModal
        onClose={Close}
        maxWidth={"700px"}
        showButton={false}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "4px 0" }}>

          {/* ── Policy Information ── */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <SectionTitle>Policy Information</SectionTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {linkedPolicyCode && (
                  <span style={{ fontSize: 13, color: "#148dc2", fontWeight: 600 }}>✓ {linkedPolicyCode}</span>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPolicySearch(true)}
                >
                  Use Existing Policy
                </button>
              </div>
            </div>
            <Policy
              embedded
              policy={selectedPolicy}
              ref={policyRef}
              key={policyKey}
              Close={() => {}}
              OnSuccess={() => {}}
              onAmountChange={setPolicyAmount}
            />
          </section>

          {/* ── Line Items ── */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <SectionTitle>Line Items</SectionTitle>
              <div style={{ display: "flex", gap: 8 }}>
                <SmallBtn onClick={() => addLineItem("tax")}>+ Tax</SmallBtn>
                <SmallBtn onClick={() => addLineItem("fee")}>+ Fee</SmallBtn>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f5f7fa" }}>
                  {["Type", "Description", "Amount", ""].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map(item => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "6px 10px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, ...typeBadge(item.type) }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      <input
                        style={{ border: "1px solid #ddd", borderRadius: 4, padding: "4px 8px", width: "100%", fontSize: 13 }}
                        value={item.description}
                        onChange={e => updateLineItem(item.id, "description", e.target.value)}
                      />
                    </td>
                    <td style={{ padding: "6px 10px" }}>
                      {item.type === "premium" ? (
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{FormatCurrency(policyAmount)}</span>
                      ) : (
                        <input
                          style={{ border: "1px solid #ddd", borderRadius: 4, padding: "4px 8px", width: 110, fontSize: 13 }}
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={e => updateLineItem(item.id, "amount", e.target.value)}
                        />
                      )}
                    </td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>
                      {item.type !== "premium" && (
                        <button onClick={() => removeLineItem(item.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #e5e7eb" }}>
                  <td colSpan={2} style={{ padding: "8px 10px", fontWeight: 700, color: "#333" }}>Total</td>
                  <td style={{ padding: "8px 10px", fontWeight: 700, color: "#148dc2", fontSize: 14 }}>{FormatCurrency(grandTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </section>

          {/* ── Finance Quotes ── */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <SectionTitle>Finance Quotes</SectionTitle>
              <button
                onClick={generateQuotes}
                disabled={policyAmount <= 0}
                style={{ padding: "7px 16px", background: policyAmount > 0 ? "#148dc2" : "#b0c4d4", color: "#fff", border: "none", borderRadius: 5, cursor: policyAmount > 0 ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600 }}
              >
                Generate Quotes
              </button>
            </div>

            {!quotesGenerated ? (
              <p style={{ color: "#999", fontSize: 13, margin: 0 }}>
                {policyAmount <= 0
                  ? "Enter a premium amount in the line items above to generate finance quotes."
                  : "Click Generate Quotes to see financing options from 3 companies."}
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {quotes.map(q => {
                  const isSelected = attachedQuote?.company === q.company;
                  return (
                    <div
                      key={q.company}
                      style={{
                        border: `2px solid ${isSelected ? "#148dc2" : "#e5e7eb"}`,
                        borderRadius: 8, padding: 14,
                        background: isSelected ? "#f0f9ff" : "#fff",
                        transition: "border-color 0.2s, background 0.2s",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#148dc2", marginBottom: 10, minHeight: 40, lineHeight: 1.3 }}>{q.company}</div>
                      <QuoteRow label="Down Payment"    value={`${FormatCurrency(q.downPaymentAmount)} (${q.downPaymentPercent}%)`} />
                      <QuoteRow label="Amount Financed" value={FormatCurrency(q.amountFinanced)} />
                      <QuoteRow label="Monthly Payment" value={FormatCurrency(q.monthlyPayment)} bold />
                      <QuoteRow label="APR"             value={`${q.apr.toFixed(2)}%`} />
                      <QuoteRow label="Term"            value={`${q.term} months`} />
                      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 8, marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
                        <span>Total</span>
                        <span style={{ color: "#148dc2" }}>{FormatCurrency(q.totalAmount)}</span>
                      </div>
                      <button
                        onClick={() => setAttachedQuote(isSelected ? null : q)}
                        style={{
                          marginTop: 12, width: "100%", padding: "7px",
                          background: isSelected ? "#148dc2" : "#fff",
                          color:      isSelected ? "#fff"    : "#148dc2",
                          border: "1px solid #148dc2",
                          borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 600,
                        }}
                      >
                        {isSelected ? "✓ Selected" : "Select"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {attachedQuote && (
              <p style={{ marginTop: 10, fontSize: 12, color: "#148dc2", fontWeight: 600 }}>
                ✓ Financing through {attachedQuote.company} attached to this invoice.
              </p>
            )}
          </section>

          {/* ── Display Options ── */}
          <section>
            <SectionTitle>Display Options</SectionTitle>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}>
              <div
                onClick={() => setShowLineItems(v => !v)}
                style={{ width: 44, height: 24, borderRadius: 12, background: showLineItems ? "#148dc2" : "#ccc", position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 }}
              >
                <div style={{ position: "absolute", top: 3, left: showLineItems ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
              </div>
              <span style={{ fontSize: 14, color: "#333" }}>Show line items on invoice</span>
            </label>
          </section>

          {/* ── Actions ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
            <button onClick={Close} style={{ padding: "10px 20px", background: "#f0f0f0", color: "#444", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 14 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "10px 24px", background: "#148dc2", color: "#fff", border: "none", borderRadius: 5, cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700 }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

        </div>
      </ConfirmationModal>
      {showPolicySearch && (
        <PolicySearch
          onSelect={handlePolicySelect}
          onClose={() => setShowPolicySearch(false)}
        />
      )}
    </>
  );
}

function SectionTitle({ children }) {
  return <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#148dc2", textTransform: "uppercase", letterSpacing: "0.06em" }}>{children}</h4>;
}

function SmallBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: "5px 12px", background: "#fff", color: "#148dc2", border: "1px solid #148dc2", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
      {children}
    </button>
  );
}

function QuoteRow({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555", marginBottom: 4 }}>
      <span>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

function typeBadge(type) {
  if (type === "premium") return { background: "#dbeafe", color: "#1d4ed8" };
  if (type === "tax")     return { background: "#fef3c7", color: "#92400e" };
  return                         { background: "#ede9fe", color: "#6d28d9" };
}
