import React, { useState, ChangeEvent , useEffect} from 'react';
import { ApiService } from '../utils/api';
import { X } from 'lucide-react';
import { Client, Invoice } from '../types';


interface FormData {
    message: string;
    file: File[] | [];
}

interface EmailModalProps {
    text: string,
    isDev: boolean,
    subdomain: string,
    client: Client | null,
    invoices? : Invoice[] | [],
    onClose: () => void,
    onSuccess: () => void
}

interface Status {
    type: 'success' | 'error' | '';
    message: string;
}

export const EmailForm: React.FC<EmailModalProps> = ({ text, isDev, subdomain, onClose, onSuccess, client, invoices }) => {

    const service = new ApiService(isDev, subdomain);
    const [formData, setFormData] = useState<FormData>({
        message: text,
        file: []

    });
    const [status, setStatus] = useState<Status>({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [emailAddresses, setEmailAddresses] = useState([client?.EmailAddress || '', client?.CSREmailAddress || ''].filter(email => email !== ''));
    const [error, setErrors] = useState<(string | null)[]>([]);

    useEffect(() => {
        const GetEmailAttachments = async () => {

            if (!invoices || invoices.length === 0) return;
            if (!client || !client.GUID) return;
            var a  = await service.getAttachmentsForInvoice(client.GUID, invoices[0].PolicyId);
            console.log(a)
        }
        GetEmailAttachments();

    }, []);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = Array.from(e.target.files || [])
            .filter(f => f.type === "application/pdf");

        if (file && file.length > 0) {
            setFormData({ ...formData, file });
            setStatus({ type: '', message: '' });
        } else {
            setStatus({ type: 'error', message: 'Please select a PDF file' });
            e.target.value = '';
        }
    };

    const handleSubmit = async () => {
        if (!formData.message.trim()) {
            setStatus({ type: 'error', message: 'Please enter a message' });
            return;
        }

        const validationErrors = emailAddresses.map(email =>
            email.trim() && isValidEmail(email) ? null : "Invalid email"
        );

        if (validationErrors.some(Boolean)) {
            setErrors(validationErrors);
            return;
        }

        setErrors([]);

        setIsSubmitting(true);
        setStatus({ type: '', message: '' });


        try {
            const response = service.sendInvoiceEmail(formData.message, formData.file!, 'Invoice Reminder for ' + client?.ClientName || '', [...emailAddresses || ''].filter(email => email.trim() !== ''));
            onSuccess();
        } catch (error) {
            setStatus({ type: 'error', message: 'Error sending email.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const containerStyle: React.CSSProperties = {
        background: '#ffffff',
        zIndex: 1000,
        position: 'absolute',
        left: '100px',
        top: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    };

    const cardStyle: React.CSSProperties = {
        width: '600px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        padding: '8px',
    };

    

    const inputGroupStyle: React.CSSProperties = {
        marginBottom: '28px'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: 'rgb(4 57 105)',
        marginBottom: '10px',
        letterSpacing: '0.3px'
    };

    const textareaStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px 16px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(61, 61, 61)',
        borderRadius: '10px',
        fontSize: '15px',
        lineHeight: '1.6',
        resize: 'none',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
    };

    const fileInputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(49, 43, 43, 0.2)',
        borderRadius: '10px',
        color: '#ffffff',
        fontSize: '14px',
        cursor: 'pointer',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
    };

    const fileSelectedStyle: React.CSSProperties = {
        fontSize: '14px',
        color: '#378867ff',
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center'
    };

    const statusBoxStyle: React.CSSProperties = {
        padding: '16px',
        borderRadius: '10px',
        marginBottom: '24px',
        animation: 'fadeIn 0.3s ease-out',
        ...(status.type === 'success' ? {
            background: 'rgba(124, 255, 203, 0.15)',
            border: '1px solid rgba(124, 255, 203, 0.3)',
            color: '#378867ff'
        } : {
            background: 'rgba(233, 69, 96, 0.15)',
            border: '1px solid rgba(233, 69, 96, 0.3)',
            color: '#ff8fa3'
        })
    };

    const toastStyle: React.CSSProperties = {
        position: "relative",
        top: "-68px",
        left: "0px",
        width: "fit-content",
        backgroundColor: "#dc3545",
        color: "white",
        textAlign: "center",
        fontSize: "0.7em",
        opacity: 1,
        transform: "translateY(0px)",
        pointerEvents: "none",
        zIndex: 1000,
        padding: "0px 7px",
        borderRadius: "4px",
        transition: "opacity 0.3s, transform 0.3s",
        whiteSpace: "nowrap"
    }

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        padding: '16px 24px',
        background: 'linear-gradient(135deg, rgb(4, 57, 105) 0%, rgb(31, 89, 129) 100%)',
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: '600',
        border: 'none',
        borderRadius: '10px',
        cursor: isSubmitting ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: isSubmitting ? 0.6 : 1,
        outline: 'none'
    };

    const spinnerStyle: React.CSSProperties = {
        display: 'inline-block',
        width: '20px',
        height: '20px',
        border: '3px solid rgba(255, 255, 255, 0.3)',
        borderTop: '3px solid #ffffff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginRight: '12px',
        verticalAlign: 'middle'
    };

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const addEmail = () => {
        setEmailAddresses([...emailAddresses, ""]);
    };

    const removeEmail = (index: number) => {
        setEmailAddresses(emailAddresses.filter((_, i) => i !== index));
    };

    const updateEmail = (index: number, value: string) => {
        const updated = [...emailAddresses];
        updated[index] = value;
        setEmailAddresses(updated);
    };




    return (
        <div style={containerStyle}>

            <div style={cardStyle}>
                <div>
                    <div style={inputGroupStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label htmlFor="To Addresses" style={labelStyle}>
                                To Addresses
                            </label>
                            <X onClick={onClose} />

                        </div>

                        {emailAddresses.map((email, index) => (
                            <div>
                                <div key={index} style={{ display: "flex", gap: "5px" }} className="form-group">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => updateEmail(index, e.target.value)}
                                        style={{
                                            width: "200px",
                                            padding: "8px 10px"
                                        }}
                                        placeholder="email@example.com"
                                    />


                                    {emailAddresses.length > 1 && (
                                        <button
                                            type="button"
                                            style={{ border: "none", backgroundColor: "white", cursor: "pointer" }}
                                            onClick={() => removeEmail(index)}
                                        >
                                            ✕
                                        </button>
                                    )}


                                </div>
                                {error[index] && (
                                    <div style={toastStyle}>{error[index]}</div>
                                )}
                            </div>
                        ))}

                        <button type="button" className="btn btn-secondary" onClick={addEmail}>
                            + Add Email
                        </button>
                    </div>
                    {/* Message Text Area */}
                    <div style={inputGroupStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label htmlFor="message" style={labelStyle}>
                                Message
                            </label>

                        </div>

                        <textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            rows={6}
                            style={textareaStyle}
                            placeholder="Enter your message here..."
                           
                        />
                    </div>

                    {/* File Upload */}
                    <div style={inputGroupStyle}>
                        <label htmlFor="file" style={labelStyle}>
                            PDF Attachment
                        </label>
                        <input
                            type="file"
                            id="file"
                            accept=".pdf"
                            multiple={true}
                            onChange={handleFileChange}
                            style={fileInputStyle}
                            
                        />
                        {formData.file && (
                            <div style={fileSelectedStyle}>

                                {formData.file.length} file(s) selected
                            </div>
                        )}
                    </div>
                    {/* Status Message */}
                    {status.message && (
                        <div style={statusBoxStyle}>
                            {status.message}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={buttonStyle}
                        onMouseEnter={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 15px 40px rgba(233, 69, 96, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(233, 69, 96, 0.3)';
                        }}
                        onMouseDown={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        {isSubmitting ? (
                            <span>
                                <span style={spinnerStyle}></span>
                                Sending...
                            </span>
                        ) : (
                            'Send Email'
                        )}
                    </button>
                </div>
            </div>


        </div>
    );
}