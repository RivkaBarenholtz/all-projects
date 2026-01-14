import { useState } from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { fetchWithAuth } from "../Utilities";

export const EmailModal = ({ transaction, close }) => {
    const [emails, setEmails] = useState([""]);
    const [errors, setErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const addEmail = () => {
        setEmails([...emails, ""]);
    };

    const removeEmail = (index) => {
        setEmails(emails.filter((_, i) => i !== index));
    };

    const updateEmail = (index, value) => {
        const updated = [...emails];
        updated[index] = value;
        setEmails(updated);
    };


    const handleConfirm = async () => {
        const validationErrors = emails.map(email =>
            email.trim() && isValidEmail(email) ? null : "Invalid email"
        );

        if (validationErrors.some(Boolean)) {
            setErrors(validationErrors);
            return;
        }

        setErrors([]);
        setIsSubmitting(true);

        try {
            await fetchWithAuth("email-receipt", {
                EmailAddresses: emails,
                Transaction: transaction
            });

            setIsSuccess(true);
        } catch (err) {
            alert("Failed to send receipt emails.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return <ConfirmationModal
        confirmButtonText={"Send Receipt"}
        onConfirm={handleConfirm}
        onClose={close}

    >
        {!isSuccess ? (
            <>
                <h2>Email Receipt:</h2>

                {emails.map((email, index) => (
                    <div>
                        <div key={index} style={{ display: "flex", gap: "5px" }} className="form-group">
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
                                >
                                    ✕
                                </button>
                            )}


                        </div>
                        {errors[index] && (
                            <div className="toast show">{errors[index]}</div>
                        )}
                    </div>
                ))}

                <button type="button" className="btn btn-secondary" onClick={addEmail}>
                    + Add Email
                </button>
            </>
        ) : (
            <div className="success-state">
                ✅ Receipt successfully emailed!
            </div>
        )}
    </ConfirmationModal>

}


