import { useState, useEffect, useRef } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { BaseUrl, FormatCurrency } from "../Utilities";
import { PolicySigner } from "./PolicySigner";
import { CreditCardTab } from "./CreditCardTab";
import { CheckTab } from "./CheckTab";
import Select from "react-select";
import Loader from "./Loader";
import { ConfirmationModal } from "../Objects/ConfimationModal";

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]
    .map(s => ({ value: s, label: s }));

const selectStyles = {
    menuList: p => ({ ...p, maxHeight: 150, overflowY: "auto", scrollbarWidth: "none" }),
    menu:     p => ({ ...p, overflow: "hidden", maxWidth: "5ch" }),
    control:  p => ({ ...p, maxWidth: "12ch", minWidth: "90px", padding: "4px 0" }),
};

export default function PolicyCheckout() {
    const { context } = useParams();
    const [searchParams] = useSearchParams();
    const policyId = searchParams.get("policyid") ?? "";

    const [step, setStep] = useState(1);
    const [vendor, setVendor] = useState(null);
    const [policy, setPolicy] = useState(null);
    const [surcharge, setSurcharge] = useState({});
    const [eSignData, setESignData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [submitPressed, setSubmitPressed] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [confirmationData, setConfirmationData] = useState(null);

    // Billing fields (pre-filled from policy where available)
    const [cardholderName, setCardholderName] = useState("");
    const [billingAddress, setBillingAddress] = useState("");
    const [city, setCity] = useState("");
    const [zip, setZip] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [stateVal, setStateVal] = useState("");
    const [notes, setNotes] = useState("");

    const cardRef = useRef();
    const checkRef = useRef();

    useEffect(() => {
        const init = async () => {
            try {
                let sub = context;
                if (!sub || sub === "app") sub = BaseUrl().split(".")[0].split("//")[1];
                if (sub === "127" || sub === "localhost") sub = "ins-dev";
                sub = sub.replace("test", "ins-dev");

                const v = await fetch(`${BaseUrl()}/pay/${sub}/get-vendor`).then(r => r.json());
                setVendor(v);

                if (policyId) {
                    const p = await fetch(`${BaseUrl()}/pay/${v.subdomain}/get-policy-by-id?policyid=${policyId}`).then(r => r.json());
                    setPolicy(p);

                    const name = [p.BillFirstName, p.BillLastName].filter(Boolean).join(" ");
                    if (name) setCardholderName(name);
                    if (p.BillStreet) setBillingAddress(p.BillStreet);
                    if (p.BillCity) setCity(p.BillCity);
                    if (p.BillState) setStateVal(p.BillState);
                    if (p.Zip) setZip(p.Zip);
                    if (p.Email) setEmail(p.Email);
                    if (p.BillPhone) setPhone(p.BillPhone);

                    try {
                        const sr = await fetch(`${BaseUrl()}/pay/${v.subdomain}/get-surcharge`, {
                            method: "POST",
                            body: JSON.stringify({ ClientLookupCode: p.CustomerNumber ?? "", InvoiceNumber: -1 }),
                            headers: { "Content-Type": "application/json" },
                        }).then(r => r.json());
                        setSurcharge(sr);
                    } catch { /* surcharge is optional */ }
                }
            } catch {
                setLoadError("Failed to load checkout. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const baseAmount    = policy?.Amount ?? parseFloat(searchParams.get("amount") ?? "0");
    const surchargeRate = surcharge?.surcharge ?? 0;
    const surchargeAmt  = paymentMethod === "card" ? baseAmount * surchargeRate : 0;
    const total         = baseAmount + surchargeAmt;
    const hasESign      = !!(policy?.SignatureFields?.length > 0 && policy?.PdfUrl);

    const handleESignReady = (data) => setESignData(data);

    const handlePaymentApproved = async (totalAmount, refNum) => {
        if (eSignData) {
            try {
                const res = await fetch(`${BaseUrl()}/pay/${vendor.subdomain}/sign-policy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        policyId:      policy.Id.replace("Policy#", ""),
                        signatureData: eSignData.capturedSignature.data,
                        signatureType: eSignData.capturedSignature.type,
                        signerName:    eSignData.signerName,
                        signerEmail:   eSignData.signerEmail,
                        auditTrail:    eSignData.auditTrail,
                    }),
                });
                if (!res.ok) throw new Error();
            } catch (Error) {
                console.error(Error)
                setErrorMessage("Payment approved but signature submission failed. Please contact support.");
                return;
            }
        }
        setConfirmationData({ totalAmount, refNum });
        setStep(4);
    };

    const handlePay = () => {
        setErrorMessage("");
        if (paymentMethod === "card") cardRef.current?.submitToGateway();
        else checkRef.current?.submitToGateway();
    };

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
            <Loader />
        </div>
    );

    if (loadError) return (
        <div style={{ textAlign: "center", padding: 40, color: "#dc2626", fontFamily: "sans-serif" }}>{loadError}</div>
    );

    if (policy?.IsSignedAndPaid) return (
        <div style={pageStyle}>
            {vendor?.LogoUrl && <LogoHeader src={vendor.LogoUrl} step={step} />}
            <div style={cardStyle}>
                <div style={{ padding: 36, textAlign: "center" }}>
                    <div style={greenCircle}>✓</div>
                    <h2 style={{ color: "#16a34a", margin: "0 0 8px" }}>Already Paid</h2>
                    <p style={{ color: "#666" }}>This policy has already been signed and paid.</p>
                </div>
            </div>
        </div>
    );

    const STEP_LABELS = ["Summary", "E‑Sign", "Payment", "Confirmed"];

    return (
        <div style={pageStyle}>
            {vendor?.LogoUrl && <LogoHeader src={vendor.LogoUrl} step={step}  />}

            {/* Step indicator */}
            <div style={{ maxWidth: step === 2 ? 1000 : 660, margin: "0 auto 24px", display: "flex", alignItems: "flex-start" }}>
                {STEP_LABELS.map((label, i) => {
                    const s = i + 1;
                    const isActive   = step === s;
                    const isDone     = step > s;
                    const isSkipped  = !hasESign && s === 2;
                    const dotColor   = isDone ? "#148dc2" : isActive ? "#148dc2" : "#e5e7eb";
                    const textColor  = isDone || isActive ? "#148dc2" : isSkipped ? "#ccc" : "#aaa";
                    return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                            {i > 0 && (
                                <div style={{
                                    position: "absolute", top: 14, right: "50%", width: "100%",
                                    height: 2, background: isDone ? "#148dc2" : "#e5e7eb", zIndex: 0,
                                }} />
                            )}
                            <div style={{
                                width: 28, height: 28, borderRadius: "50%", zIndex: 1, position: "relative",
                                background: dotColor, color: isDone || isActive ? "#fff" : "#aaa",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontWeight: 700,
                            }}>
                                {isDone ? "✓" : s}
                            </div>
                            <span style={{ fontSize: 11, marginTop: 5, color: textColor, fontWeight: isActive ? 700 : 400 }}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div style={{ ...cardStyle, maxWidth: step === 2 ? 1000 : 660 }}>

                {/* ── Step 1: Summary ─────────────────────────────── */}
                {step === 1 && (
                    <div style={{ padding: 28 }}>
                        <h2 style={stepTitle}>Policy Summary</h2>

                        <div style={{ marginBottom: 20 }}>
                            {policy?.PolicyCode        && <InfoRow label="Policy #"     value={policy.PolicyCode} />}
                            {policy?.PolicyDescription && <InfoRow label="Description"  value={policy.PolicyDescription} />}
                            {policy?.CarrierName       && <InfoRow label="Carrier"       value={policy.CarrierName} />}
                        </div>

                        {policy?.ShowLineItems && policy?.LineItems?.length > 0 && (
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={{ background: "#f8fafc" }}>
                                        <th style={th}>Description</th>
                                        <th style={{ ...th, textAlign: "right" }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {policy.LineItems.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                            <td style={td}>{item.Description ?? item.description}</td>
                                            <td style={{ ...td, textAlign: "right" }}>{FormatCurrency(item.Amount ?? item.amount ?? 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div style={totalBox}>
                            <div style={totalRow}>
                                <span style={{ color: "#555" }}>Premium</span>
                                <span>{FormatCurrency(baseAmount)}</span>
                            </div>
                            <div style={{ ...totalRow, borderTop: "1px solid #e5e7eb", paddingTop: 10, marginTop: 6, fontWeight: 700, fontSize: 16 }}>
                                <span>Total Due</span>
                                <span style={{ color: "#148dc2" }}>{FormatCurrency(baseAmount)}</span>
                            </div>
                        </div>

                        <button onClick={() => setStep(hasESign ? 2 : 3)} style={primaryBtn}>
                            {hasESign ? "Continue to E-Sign →" : "Continue to Payment →"}
                        </button>
                    </div>
                )}

                {/* ── Step 2: E-Sign ──────────────────────────────── */}
                {step === 2 && policy && (
                    <PolicySigner
                        pdfUrl={policy.PdfUrl}
                        policy={policy}
                        signerName={cardholderName || email || "Signer"}
                        signerEmail={email}
                        onReady={handleESignReady}
                        onClose={() => setStep(3)}
                        inline={true}
                    />
                )}

                {/* ── Step 3: Billing & Payment ────────────────────── */}
                {step === 3 && (
                    <div style={{ padding: 28 }}>
                       
                        {/* Payment method toggle */}
                        <SectionLabel>Payment Method</SectionLabel>
                        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                            {[
                                { key: "card", label: "💳  Credit / Debit Card" },
                                { key: "ach",  label: "🏦  eCheck (ACH)" },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setPaymentMethod(key)}
                                    style={{
                                        flex: 1, padding: "10px 14px", cursor: "pointer",
                                        border: `2px solid ${paymentMethod === key ? "#148dc2" : "#e5e7eb"}`,
                                        borderRadius: 8,
                                        background: paymentMethod === key ? "#f0f8fd" : "#fff",
                                        color: paymentMethod === key ? "#148dc2" : "#555",
                                        fontWeight: 600, fontSize: 13,
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Surcharge notice */}
                        {paymentMethod === "card" && surchargeRate > 0 && (
                            <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#854d0e", marginBottom: 16 }}>
                                A {(surchargeRate * 100).toFixed(2)}% convenience fee applies to card payments.
                            </div>
                        )}

                        {/* iFields — both mounted, toggled by display */}
                        <div style={{ display: paymentMethod === "card" ? "block" : "none" }}>
                            <CreditCardTab
                                ref={cardRef}
                                amount={baseAmount}
                                surcharge={surchargeRate}
                                surchargeAmount={surchargeAmt}
                                accountCode={policy?.CustomerNumber ?? ""}
                                accountValid={true}
                                invoiceID=""
                                ifieldsKey={vendor?.CardknoxIFeildsKey}
                                cardHolderName={cardholderName}
                                billingAddress={billingAddress}
                                city={city}
                                state={stateVal}
                                email={email}
                                notes={notes}
                                phone={phone}
                                zip={zip}
                                setEverythingFocused={() => {}}
                                selectCustomStyles={selectStyles}
                                isPortal={false}
                                onFinish={() => {}}
                                onError={msg => setErrorMessage(msg)}
                                subdomain={vendor?.subdomain}
                                submitPressed={submitPressed}
                                setSubmitPressed={setSubmitPressed}
                                hidePaymentButton={true}
                                showProcess={false}
                                onPaymentApproved={handlePaymentApproved}
                                policyId={policyId}
                            />
                        </div>
                        <div style={{ display: paymentMethod === "ach" ? "block" : "none" }}>
                            <CheckTab
                                ref={checkRef}
                                amount={baseAmount}
                                accountCode={policy?.CustomerId ?? "avccc"}
                                invoiceID=""
                                ifieldsKey={vendor?.CardknoxIFeildsKey}
                                cardHolderName={cardholderName}
                                billingAddress={billingAddress}
                                city={city}
                                state={stateVal}
                                email={email}
                                notes={notes}
                                phone={phone}
                                zip={zip}
                                setEverythingFocused={() => {}}
                                isPortal={false}
                                onFinish={() => {}}
                                onError={msg => setErrorMessage(msg)}
                                subdomain={vendor?.subdomain}
                                submitPressed={submitPressed}
                                setSubmitPressed={setSubmitPressed}
                                hidePaymentButton={true}
                                showProcess={false}
                                onPaymentApproved={handlePaymentApproved}
                                policyId={policyId}
                            />
                        </div>

                        {/* Total */}
                        <div style={{ ...totalBox, marginTop: 20 }}>
                            <div style={totalRow}>
                                <span style={{ color: "#555" }}>Premium</span>
                                <span>{FormatCurrency(baseAmount)}</span>
                            </div>
                            {surchargeAmt > 0 && (
                                <div style={totalRow}>
                                    <span style={{ color: "#555" }}>Convenience Fee</span>
                                    <span>{FormatCurrency(surchargeAmt)}</span>
                                </div>
                            )}
                            <div style={{ ...totalRow, borderTop: "1px solid #e5e7eb", paddingTop: 10, marginTop: 6, fontWeight: 700, fontSize: 16 }}>
                                <span>Total</span>
                                <span style={{ color: "#148dc2" }}>{FormatCurrency(total)}</span>
                            </div>
                        </div>

                        {errorMessage && (
                            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginTop: 12 }}>
                                {errorMessage}
                            </div>
                        )}

                        <button onClick={handlePay} style={{ ...primaryBtn, marginTop: 16 }}>
                            🔒 Pay {FormatCurrency(total)}
                        </button>
                        <p style={{ textAlign: "center", fontSize: 12, color: "#aaa", margin: "8px 0 0" }}>
                            SSL encrypted · PCI compliant
                        </p>
                    </div>
                )}

                {/* ── Step 4: Confirmed ────────────────────────────── */}
                {step === 4 && (
                    <div style={{ padding: 36, textAlign: "center" }}>
                        <div style={greenCircle}>✓</div>
                        <h2 style={{ color: "#16a34a", margin: "0 0 8px", fontSize: 22 }}>Payment Confirmed!</h2>
                        <p style={{ color: "#666", marginBottom: 24 }}>
                            Thank you. Your policy has been signed and payment processed.
                        </p>
                        <div style={{ ...totalBox, textAlign: "left" }}>
                            {policy?.PolicyCode             && <InfoRow label="Policy #"       value={policy.PolicyCode} />}
                            {confirmationData?.refNum       && <InfoRow label="Confirmation #"  value={confirmationData.refNum} />}
                            <InfoRow label="Date" value={new Date().toLocaleDateString("en-US")} />
                            <div style={{ ...totalRow, borderTop: "1px solid #e5e7eb", paddingTop: 10, marginTop: 6, fontWeight: 700, fontSize: 15 }}>
                                <span>Amount Paid</span>
                                <span style={{ color: "#148dc2" }}>{FormatCurrency(confirmationData?.totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Small helpers ─────────────────────────────────────────── */
function LogoHeader({ src , step}) {
    return (
        <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img src={src} alt="logo" style={{maxWidth: step === 2 ? 1000 : 660}} />
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 14 }}>
            <span style={{ color: "#888" }}>{label}</span>
            <span style={{ fontWeight: 500, color: "#1a1a2e" }}>{value}</span>
        </div>
    );
}

function SectionLabel({ children }) {
    return <h3 style={{ margin: "0 0 10px", color: "#444", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{children}</h3>;
}

function FieldLabel({ children }) {
    return <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</label>;
}

/* ── Styles ────────────────────────────────────────────────── */
const pageStyle  = { background: "#f5f7fa", minHeight: "100vh", padding: "32px 16px", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" };
const cardStyle  = { maxWidth: 660, margin: "0 auto", background: "#fff", borderRadius: 14, boxShadow: "0 2px 20px rgba(0,0,0,0.08)", overflow: "hidden" };
const stepTitle  = { margin: "0 0 20px", color: "#1a1a2e", fontSize: 20, fontWeight: 700 };
const totalBox   = { background: "#f8fafc", borderRadius: 8, padding: "14px 16px" };
const totalRow   = { display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 };
const primaryBtn = { width: "100%", padding: 14, background: "#148dc2", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 20 };
const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 };
const th         = { padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "1px solid #e5e7eb" };
const td         = { padding: "8px 10px" };
const greenCircle = { width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28, color: "#16a34a" };
