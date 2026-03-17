import { useState } from "react";
import { fetchWithAuth, FormatCurrency } from "../Utilities";
import { PolicySearch } from "../Objects/PolicySearch";

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
    company: name,
    downPaymentPercent: downPct * 100,
    downPaymentAmount:  down,
    amountFinanced:     financed,
    monthlyPayment:     monthly,
    apr:                apr * 100,
    term,
    totalAmount:        down + monthly * term,
  };
}

export function InvoiceBuilder({ invoice: editInvoice, onSave, onClose }) {
  const isEdit = !!editInvoice;

  // Policy source
  const [policySource,     setPolicySource]     = useState(editInvoice?.PolicyId ? "linked" : "manual");
  const [showPolicySearch, setShowPolicySearch] = useState(false);
  const [linkedPolicyId,   setLinkedPolicyId]   = useState(editInvoice?.PolicyId ?? "");
  const [linkedPolicyCode, setLinkedPolicyCode] = useState("");

  // Policy info fields
  const [policyNumber,  setPolicyNumber]  = useState(editInvoice?.PolicyNumber      ?? "");
  const [insuredName,   setInsuredName]   = useState(editInvoice?.InsuredName        ?? "");
  const [insuredEmail,  setInsuredEmail]  = useState(editInvoice?.InsuredEmail       ?? "");
  const [carrier,       setCarrier]       = useState(editInvoice?.CarrierName        ?? "");
  const [startDate,     setStartDate]     = useState(editInvoice?.PolicyStartDate    ?? "");
  const [endDate,       setEndDate]       = useState(editInvoice?.PolicyEndDate      ?? "");
  const [description,   setDescription]  = useState(editInvoice?.PolicyDescription  ?? "");

  // Line items
  const [lineItems, setLineItems] = useState(
    editInvoice?.LineItems?.length
      ? editInvoice.LineItems
      : [{ id: crypto.randomUUID(), type: "premium", description: "Policy Premium", amount: 0 }]
  );
  const [showLineItems, setShowLineItems] = useState(editInvoice?.ShowLineItems ?? true);

  // Finance
  const [quotes,          setQuotes]          = useState([]);
  const [quotesGenerated, setQuotesGenerated] = useState(false);
  const [attachedQuote,   setAttachedQuote]   = useState(editInvoice?.AttachedFinanceQuote ?? null);

  const [saving, setSaving] = useState(false);

  // When a policy is selected from the search grid
  const handlePolicySelect = (p) => {
    const id = p.Id ?? p.PolicyId;
    setLinkedPolicyId(id ?? "");
    setLinkedPolicyCode(p.PolicyCode ?? "");
    setPolicyNumber(p.PolicyCode ?? "");
    setInsuredName(p.InsuredDisplay ?? `${p.Customer?.BillFirstName ?? ""} ${p.Customer?.BillLastName ?? ""}`.trim() || p.Customer?.BillCompany || "");
    setInsuredEmail(p.Customer?.Email ?? "");
    setCarrier(p.CarrierName ?? "");
    setStartDate(p.PolicyStartDate ? p.PolicyStartDate.substring(0, 10) : "");
    setEndDate(p.PolicyEndDate     ? p.PolicyEndDate.substring(0, 10)   : "");
    setDescription(p.PolicyDescription ?? "");
    setLineItems(prev => [
      { id: crypto.randomUUID(), type: "premium", description: "Policy Premium", amount: p.Amount ?? 0 },
      ...prev.filter(x => x.type !== "premium"),
    ]);
    setShowPolicySearch(false);
  };

  const premiumTotal = lineItems
    .filter(x => x.type === "premium")
    .reduce((s, x) => s + (Number(x.amount) || 0), 0);

  const grandTotal = lineItems.reduce((s, x) => s + (Number(x.amount) || 0), 0);

  const generateQuotes = () => {
    setQuotes(FINANCE_COMPANIES.map(c => calcQuote(premiumTotal, c)));
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

  const handleSave = async (status = "draft") => {
    setSaving(true);
    try {
      const payload = {
        ...(editInvoice ?? {}),
        PolicyId:             policySource === "linked" ? linkedPolicyId : null,
        PolicyNumber:         policyNumber,
        InsuredName:          insuredName,
        InsuredEmail:         insuredEmail,
        CarrierName:          carrier,
        PolicyStartDate:      startDate,
        PolicyEndDate:        endDate,
        PolicyDescription:    description,
        LineItems:            lineItems.map(x => ({ ...x, amount: Number(x.amount) || 0 })),
        ShowLineItems:        showLineItems,
        AttachedFinanceQuote: attachedQuote,
        Status:               status,
      };
      const endpoint = isEdit ? "update-invoice" : "create-invoice";
      const result   = await fetchWithAuth(endpoint, payload);
      onSave?.(result);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <>
      {showPolicySearch && (
        <PolicySearch
          onSelect={handlePolicySelect}
          onClose={() => setShowPolicySearch(false)}
        />
      )}

      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9998, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "24px 16px" }}>
        <div style={{ background: "#fff", borderRadius: 8, width: "100%", maxWidth: 900, boxShadow: "0 8px 40px rgba(0,0,0,0.3)", marginBottom: 24 }}>

          {/* Header */}
          <div style={{ background: "#148dc2", color: "#fff", padding: "14px 20px", borderRadius: "8px 8px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{isEdit ? "Edit Invoice" : "New Invoice"}</span>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✕</button>
          </div>

          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 28 }}>

            {/* ── Section 1: Policy Info ── */}
            <section>
              <SectionTitle>Policy Information</SectionTitle>
              <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                {[["linked", "Link existing policy"], ["manual", "Enter manually"]].map(([val, label]) => (
                  <label key={val} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: policySource === val ? 600 : 400, fontSize: 14 }}>
                    <input type="radio" checked={policySource === val} onChange={() => setPolicySource(val)} style={{ cursor: "pointer" }} />
                    {label}
                  </label>
                ))}
              </div>

              {policySource === "linked" && (
                <div style={{ marginBottom: 14 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPolicySearch(true)}
                    style={{ marginBottom: 6 }}
                  >
                    Search Existing Policies
                  </button>
                  {linkedPolicyCode && (
                    <span style={{ marginLeft: 12, fontSize: 13, color: "#148dc2", fontWeight: 600 }}>
                      ✓ {linkedPolicyCode} selected
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Policy Number"     value={policyNumber}  onChange={setPolicyNumber} />
                <Field label="Insured Name"      value={insuredName}   onChange={setInsuredName} />
                <Field label="Insured Email"     value={insuredEmail}  onChange={setInsuredEmail} />
                <Field label="Carrier"           value={carrier}       onChange={setCarrier} />
                <Field label="Policy Start Date" value={startDate}     onChange={setStartDate} type="date" />
                <Field label="Policy End Date"   value={endDate}       onChange={setEndDate}   type="date" />
              </div>
              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">Description</label>
                <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Policy description" />
              </div>
            </section>

            {/* ── Section 2: Line Items ── */}
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
                        <input
                          style={{ border: "1px solid #ddd", borderRadius: 4, padding: "4px 8px", width: 110, fontSize: 13 }}
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={e => updateLineItem(item.id, "amount", e.target.value)}
                        />
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

            {/* ── Section 3: Finance Quotes ── */}
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <SectionTitle>Finance Quotes</SectionTitle>
                <button
                  onClick={generateQuotes}
                  disabled={premiumTotal <= 0}
                  style={{ padding: "7px 16px", background: premiumTotal > 0 ? "#148dc2" : "#b0c4d4", color: "#fff", border: "none", borderRadius: 5, cursor: premiumTotal > 0 ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600 }}
                >
                  Generate Quotes
                </button>
              </div>

              {!quotesGenerated ? (
                <p style={{ color: "#999", fontSize: 13, margin: 0 }}>
                  {premiumTotal <= 0
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
                          borderRadius: 8,
                          padding: 14,
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

            {/* ── Section 4: Display Options ── */}
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
              <button onClick={onClose} style={{ padding: "10px 20px", background: "#f0f0f0", color: "#444", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={() => handleSave("draft")} disabled={saving} style={{ padding: "10px 20px", background: "#fff", color: "#148dc2", border: "1px solid #148dc2", borderRadius: 5, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                {saving ? "Saving…" : "Save Draft"}
              </button>
              <button onClick={() => handleSave("sent")} disabled={saving} style={{ padding: "10px 24px", background: "#148dc2", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#148dc2", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {children}
    </h4>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
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
