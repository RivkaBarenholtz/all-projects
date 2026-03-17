import { useState } from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { fetchWithAuth } from "../Utilities";

export function SignPayEmailModal({ policy, vendor, link, close }) {
    const [emails, setEmails] = useState([policy?.Email ?? ""]);
    const [errors, setErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const addEmail = () => setEmails([...emails, ""]);
    const removeEmail = (index) => setEmails(emails.filter((_, i) => i !== index));
    const updateEmail = (index, value) => {
        const updated = [...emails];
        updated[index] = value;
        setEmails(updated);
    };

    const handleConfirm = async () => {
        const validationErrors = emails.map(e =>
            e.trim() && isValidEmail(e) ? null : "Invalid email"
        );
        if (validationErrors.some(Boolean)) { setErrors(validationErrors); return; }

        setErrors([]);
        setIsSubmitting(true);
        try {
            const body = `<p>Hello,</p>
<p>Please use the link below to review, sign, and pay for your policy (<strong>${policy?.PolicyCode ?? ""}</strong>):</p>
<p><a href="${link}">${link}</a></p>
<p>Thank you.</p>`;

            await fetchWithAuth("send-invoice-email", {
                recipients: emails,
                Subject: `Sign & Pay — Policy ${policy?.PolicyCode ?? ""}`,
                Body: body,
                Attachment: [],
                epicAttachments: [],
            });
            setIsSuccess(true);
        } catch {
            alert("Failed to send email.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ConfirmationModal
            showButton={!isSuccess}
            confirmButtonText={isSubmitting ? "Sending…" : "Send"}
            onConfirm={handleConfirm}
            onClose={close}
        >
            {!isSuccess ? (
                <>
                    <h2>Email Sign &amp; Pay Link</h2>
                    {emails.map((email, index) => (
                        <div key={index}>
                            <div style={{ display: "flex", gap: "5px" }} className="form-group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => updateEmail(index, e.target.value)}
                                    className="form-input"
                                    placeholder="email@example.com"
                                />
                                {emails.length > 1 && (
                                    <button
                                        type="button"
                                        style={{ border: "none", backgroundColor: "white", cursor: "pointer" }}
                                        onClick={() => removeEmail(index)}
                                    >✕</button>
                                )}
                            </div>
                            {errors[index] && <div className="toast show">{errors[index]}</div>}
                        </div>
                    ))}
                    <button type="button" className="btn btn-secondary" onClick={addEmail}>
                        + Add Email
                    </button>
                </>
            ) : (
                <div className="success-state">✅ Sign &amp; Pay link sent!</div>
            )}
        </ConfirmationModal>
    );
}
