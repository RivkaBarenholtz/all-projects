import { useState } from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { fetchWithAuth } from "../Utilities";

export function NewVendor({ Close, OnSuccess, vendor }) {
    const [name, setName] = useState(vendor?.Name ?? "");
    const [paymentAccountNumber, setPaymentAccountNumber] = useState(vendor?.PaymentAccountNumber ?? "");
    const [paymentRoutingNumber, setPaymentRoutingNumber] = useState(vendor?.PaymentRoutingNumber ?? "");
    const [address, setAddress] = useState(vendor?.Address ?? "");
    const [notes, setNotes] = useState(vendor?.Notes ?? "");
    const [submitPressed, setSubmitPressed] = useState(false);

    const save = async () => {
        setSubmitPressed(true);
        if (!name) return;

        const body = {
            ...(vendor?.Id ? { Id: vendor.Id } : {}),
            Name: name,
            PaymentAccountNumber: paymentAccountNumber,
            PaymentRoutingNumber: paymentRoutingNumber,
            Address: address,
            Notes: notes,
        };

        const endpoint = vendor?.Id ? "update-customervendor" : "create-customervendor";
        await fetchWithAuth(endpoint, body);
        OnSuccess();
    };

    const form = (
        <>
            <section className="form-section">
                <h3>Vendor Info</h3>
                <div className="form-group">
                    <label>Name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} />
                    {submitPressed && !name && <div className="toast show">Name required.</div>}
                </div>
                <div className="form-group">
                    <label>Payment Account #</label>
                    <input type="text" value={paymentAccountNumber} onChange={e => setPaymentAccountNumber(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Payment Routing #</label>
                    <input type="text" value={paymentRoutingNumber} onChange={e => setPaymentRoutingNumber(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Address</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
            </section>
        </>
    );

    return (
        <ConfirmationModal confirmButtonText="Save" onClose={Close} onConfirm={save}>
            {form}
        </ConfirmationModal>
    );
}
