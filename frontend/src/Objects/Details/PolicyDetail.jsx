import Detail from "../Detail"
import { useEffect, useState, useRef } from "react";
import { ActionButton } from "../../Components/UI/actionButton";
import { Link, Check, Download } from "lucide-react";
import { fetchWithAuth } from "../../Utilities";
import { useSuccessModal } from "../SuccessModal";
import { Policy } from "../NewPolicy";
import { PolicyFieldPlacer } from "../PolicyFieldPlacer";

export function PolicyDetail({ policy, onClose }) {

    const policyRef = useRef();

    const [vendor, setVendor] = useState({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [showFieldPlacer, setShowFieldPlacer] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);

    useEffect(() => {
        const getVendor = async () => {
            const result = await fetchWithAuth("get-vendor", {})
            setVendor(result);
        }
        getVendor();
    }, [])

    const { showSuccess, SuccessModal } = useSuccessModal();

    const generateSignAndPayLink = () => {
        return `https://pay.instechpay.co/${vendor?.subdomain}?policyid=${policy.PolicyId.replace("Policy#", "")}&amount=${policy.PolicyAmount}`;
    }

    const handleSignAndPayClick = async () => {
        // If the policy has a PDF, open the field placer first
        if (policy.QuoteFileName) {
            const data = await fetchWithAuth(`get-policy-doc-url?policyid=${policy.PolicyId.replace("Policy#", "")}`);
            setPdfUrl(data.download);
            setShowFieldPlacer(true);
        } else {
            // No PDF — just copy the link directly
            navigator.clipboard.writeText(generateSignAndPayLink());
            showSuccess("Pay link copied to clipboard");
        }
    }

    const handleFieldsSaved = (fields) => {
        setShowFieldPlacer(false);
        setPdfUrl(null);
        const link = generateSignAndPayLink();
        navigator.clipboard.writeText(link);
        showSuccess(`Fields saved. Pay link copied to clipboard — ${fields.length} field(s) placed.`);
    }

    const SaveChanges = () => {
        if (policyRef.current) {
            policyRef.current.submit();
        }
    }

    async function downloadFile() {
        const data = await fetchWithAuth(`get-policy-doc-url?policyid=${policy.PolicyId.replace("Policy#", "")}`);
        const url = data.download;
        const response = await fetch(url);
        const blob = await response.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = policy.QuoteFileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
    }

    async function downloadSignedFile() {
        const data = await fetchWithAuth(`get-signed-doc-url?policyid=${policy.PolicyId.replace("Policy#", "")}`);
        const url = data.url;
        const response = await fetch(url);
        const blob = await response.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `signed_${policy.PolicyCode}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
    }

    const body = () => {
        return <>
            {showFieldPlacer && pdfUrl && (
                <PolicyFieldPlacer
                    pdfUrl={pdfUrl}
                    policyId={policy.PolicyId.replace("Policy#", "")}
                    initialFields={policy.SignatureFields ?? []}
                    onClose={() => { setShowFieldPlacer(false); setPdfUrl(null); }}
                    onSaved={handleFieldsSaved}
                />
            )}

            <button
                title={isEditMode ? "Save changes" : "Edit"}
                style={{
                    width: '40px', height: '40px', borderRadius: '50%', marginRight: "10px",
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
                onClick={() => { setIsEditMode(!isEditMode); SaveChanges() }}
            >
                {isEditMode ? "✔" : "✎"}
            </button>

            {!isEditMode ? <>
                <div className="trd-section">
                    <h3 className="trd-section-title">Policy Information</h3>
                    <div className="trd-info-grid">
                        <div className="trd-info-row"><span className="trd-label">Policy Code:</span><span className="trd-value">{policy.PolicyCode}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Policy Description:</span><span className="trd-value">{policy.PolicyDescription}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Policy Amount:</span><span className="trd-value">{policy.PolicyAmountString}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Commission Amount:</span><span className="trd-value">{policy.CommissionAmountString}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Carrier:</span><span className="trd-value">{policy.CarrierName}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Payable To Carrier:</span><span className="trd-value">{policy.PayableAmountString}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Paid To Carrier</span><span className="trd-value">{policy.PaidToCarrierString}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Owed To Carrier</span><span className="trd-value">{policy.OwedAmountString}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Customer Paid</span><span className="trd-value">{policy.CustomerPaidString}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Customer Balance</span><span className="trd-value">{policy.CustomerBalanceString}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Sub-broker:</span><span className="trd-value">{policy.SubBrokerName}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Sub-broker Commission:</span><span className="trd-value">{policy.SubBrokerAmountString}</span></div>
                    </div>
                </div>

                <div className="trd-section">
                    <h3 className="trd-section-title">Customer Information</h3>
                    <div className="trd-info-grid">
                        <div className="trd-info-row"><span className="trd-label">Customer #:</span><span className="trd-value">{policy.CustomerNumber}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Email:</span><span className="trd-value">{policy.Email}</span></div>
                    </div>
                </div>

                <div className="trd-section">
                    <h3 className="trd-section-title">Billing Information</h3>
                    <div className="trd-info-grid">
                        <div className="trd-info-row"><span className="trd-label">First Name:</span><span className="trd-value">{policy.BillFirstName}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Last Name:</span><span className="trd-value">{policy.BillLastName}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Company:</span><span className="trd-value">{policy.BillCompany}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Address:</span><span className="trd-value">{policy.BillStreet}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Address Line 2:</span><span className="trd-value">{policy.BillStreet2}</span></div>
                        <div className="trd-info-row"><span className="trd-label">City, State:</span><span className="trd-value">{policy.BillCity}, {policy.BillState} {policy.Zip}</span></div>
                        <div className="trd-info-row"><span className="trd-label">Phone:</span><span className="trd-value">{policy.BillPhone}</span></div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {!policy.IsSignedAndPaid ? <>
                                <ActionButton onClick={handleSignAndPayClick}>
                                    <Link /> {policy.QuoteFileName ? "Place Fields & Copy Sign+Pay Link" : "Copy Sign & Pay Link"}
                                </ActionButton>
                                {policy.QuoteFileName &&
                                    <ActionButton onClick={downloadFile}>
                                        <Download /> Download Policy Document
                                    </ActionButton>
                                }
                            </> : <>
                                <span style={{ display: "flex", justifyContent: "center", gap: "5px", backgroundColor: "#185c3f", color: "white", padding: "6px" }}>
                                    <Check /> Policy Signed &amp; Paid
                                </span>
                                {policy.SignedPdfKey &&
                                    <ActionButton onClick={downloadSignedFile}>
                                        <Download /> Download Signed Document
                                    </ActionButton>
                                }
                            </>}
                        </div>
                    </div>
                </div>
            </> :
                <Policy
                    ref={policyRef}
                    isEdit={true}
                    policy={policy}
                    OnSuccess={() => { setIsEditMode(false); showSuccess("Policy updated successfully") }} />
            }
        </>
    }

    return <><SuccessModal /><Detail title={"Policy Info"} body={body()} onClose={onClose} /></>
}
