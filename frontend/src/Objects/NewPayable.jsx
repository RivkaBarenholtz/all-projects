import { useState, useEffect } from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { fetchWithAuth } from "../Utilities";
import { VendorSearch } from "./VendorSearch";

export function NewPayable({ Close, OnSuccess, initialCarrierName, initialAmount, initialPolicyId }) {
    // Vendor fields
    // const [vendorId, setVendorId] = useState("");
    // const [vendorName, setVendorName] = useState(initialCarrierName ?? "");
    // const [paymentAccountNumber, setPaymentAccountNumber] = useState("");
    // const [paymentRoutingNumber, setPaymentRoutingNumber] = useState("");
    // const [vendorAddress, setVendorAddress] = useState("");
     
    // Payable fields
    const [amount, setAmount] = useState(initialAmount != null ? String(initialAmount) : "");
    const [notes, setNotes] = useState("");

    const [invoiceId, setInvoiceId] = useState("");
    const [policyId, setPolicyId] = useState(initialPolicyId ?? "");

    const [showVendorSearch, setShowVendorSearch] = useState(false);
    const [submitPressed, setSubmitPressed] = useState(false);

    // On open, if a carrier name was provided try to find a matching vendor by name
    useEffect(() => {
        if (!initialCarrierName) return;
        fetchWithAuth(`get-customervendor-by-name?name=${encodeURIComponent(initialCarrierName)}`, {})
            .then(v => { if (v?.Id) applyVendor(v); })
            .catch(() => {});
    }, []);

    // function applyVendor(v) {
    //     setVendorId(v.Id ?? "");
    //     setVendorName(v.Name ?? "");
    //     setPaymentAccountNumber(v.PaymentAccountNumber ?? "");
    //     setPaymentRoutingNumber(v.PaymentRoutingNumber ?? "");
    //     setVendorAddress(v.Address ?? "");
    //     setVendorNotes(v.Notes ?? "");
    //     setShowVendorSearch(false);
    // }

    const remitPayment = async () => {
        setSubmitPressed(true);
        if ( !amount) return;

        const payable = {
            Amount: parseFloat(amount) || 0,
           // InvoiceId: invoiceId,
            PolicyId: policyId,
            //CustomerVendorId: vendorId,
            VendorName: initialCarrierName,
            // PaymentAccountNumber: paymentAccountNumber,
            // PaymentRoutingNumber: paymentRoutingNumber,
            //VendorAddress: vendorAddress,
            VendorNotes: notes,
            // PaymentRefNum will be set by backend once gateway call is implemented
        };

        const result = await fetchWithAuth("create-payable", payable);

        // TODO: once gateway returns a ref num, it will be in result.PaymentRefNum
        // The backend will save it on the dynamo item at that point

        OnSuccess(result);
    };

    return (
        <>
            {showVendorSearch && (
                <VendorSearch onSelect={applyVendor} onClose={() => setShowVendorSearch(false)} />
            )}

            <ConfirmationModal confirmButtonText="Remit Payment" onClose={Close} onConfirm={remitPayment}>
                {/* <section className="form-section">
                    <h3>Vendor</h3>

                    <div style={{ marginBottom: 12 }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowVendorSearch(true)}
                            style={{ marginBottom: 10 }}
                        >
                            Search Existing Vendors
                        </button>
                    </div>

                    <div className="form-group">
                        <label>Vendor Name *</label>
                        <input type="text" value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="Enter vendor name" />
                        {submitPressed && !vendorName && <div className="toast show">Vendor name required.</div>}
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Payment Account #</label>
                            <input type="text" value={paymentAccountNumber} onChange={e => setPaymentAccountNumber(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Payment Routing #</label>
                            <input type="text" value={paymentRoutingNumber} onChange={e => setPaymentRoutingNumber(e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Address</label>
                        <input type="text" value={vendorAddress} onChange={e => setVendorAddress(e.target.value)} />
                    </div>
                   
                </section> */}

                <section className="form-section">
                    <h3>Payment Details</h3>
                    {initialCarrierName && (
                        <div className="form-group">
                            <label>Carrier</label>
                            <input type="text" value={initialCarrierName} readOnly style={{ background: "#f5f7fa", color: "#555" }} />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Amount *</label>
                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                        {submitPressed && !amount && <div className="toast show">Amount required.</div>}
                    </div>
                     <div className="form-group">
                        <label>Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                    <div className="form-row">
                       <div className="form-group">
                            <label>Policy ID</label>
                            <input type="text" value={policyId} onChange={e => setPolicyId(e.target.value)} />
                        </div>
                    </div>
                </section>
            </ConfirmationModal>
        </>
    );
}
