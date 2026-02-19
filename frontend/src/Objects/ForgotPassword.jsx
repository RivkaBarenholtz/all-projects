import React, { useState } from "react";
import { CognitoUserPool, CognitoUser } from "amazon-cognito-identity-js";

import { isValidEmail } from "../Utilities";

const poolData = {
    UserPoolId: 'us-east-1_guWlEt63Z',
    ClientId: '7nmt8a8ooc0oq1lcaj70n474ff'
};

const userPool = new CognitoUserPool(poolData);

export default function ForgotPassword({ setForgot, setMessage }) {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [resetCode, setResetCode] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [confirmPassword, setConfirmPassword] = useState("")
    const [message, setSendMessage] = useState("If an account exists for this email, you will receive a password reset code.")
    const [resending, setResending] = useState(false)
    const [loading, setLoading] = useState(false)

    const sendCode = () => {
        if (!email || !isValidEmail(email)) {
            setError("Please enter a valid email.");
            return false;
        }
        const user = new CognitoUser({ Username: email, Pool: userPool });

        user.forgotPassword({
            onSuccess: () => setSent(true),
            onFailure: (err) => setError(err.message)
        });
    };

    const resend = () => {
        setResending(true);
        sendCode();
        setSendMessage("A new code has been sent (if this email exists in our system).")
        setResending(false)
    };



    const validatePassword = (password) => {
        const hasMinLength = password.length >= 8;
        const hasNumber = /\d/.test(password);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return { hasMinLength, hasNumber, hasSymbol };
    };
    const validation = validatePassword(newPassword);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');


        if (!validation.hasMinLength || !validation.hasNumber || !validation.hasSymbol) {
            setError('Please meet all password requirements');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }


        submitNewPassword();
    }

    const submitNewPassword = () => {
        const user = new CognitoUser({ Username: email, Pool: userPool });

        user.confirmPassword(resetCode, newPassword, {
            onSuccess() {
                setMessage("Password reset successfully")
                setForgot(false);
            },
            onFailure(err) {
                setError(err.message);
            }
        });
    };


    return (
        <div>
            {!sent ? (
                <>
                    <div> {error} </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                        />

                        <div style={{ padding: "8px", width: "100%", display: "flex", justifyContent: "space-around" }}><button className="btn btn-primary" onClick={sendCode}>Send Reset Code</button></div>
                    </div>
                </>
            ) : (
                <>
                    <p style={{ marginBottom: "20px" }}> {message} </p>


                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#991b1b',
                                padding: '12px 16px',
                                borderRadius: '4px',
                                marginBottom: '24px',
                                fontSize: '14px'
                            }}>
                                {error}
                            </div>
                        )}

                        <a className="forgot-password" onClick={resend} disabled={resending}>
                            {resending ? "Resending..." : "Resend Code"}
                        </a>


                        <div style={{ marginBottom: '8px' }}>


                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                Reset Code
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    placeholder="Confirmation Code"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '15px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}

                                />

                            </div>
                        </div>


                        {/* Password Requirements */}
                        <div style={{
                            backgroundColor: '#f3f4f6',
                            borderLeft: '3px solid #374151',
                            padding: '16px',
                            marginBottom: '24px',
                            borderRadius: '4px'
                        }}>
                            <ul style={{
                                listStyle: 'disc',
                                paddingLeft: '20px',
                                margin: 0,
                                color: '#6b7280',
                                fontSize: '14px',
                                lineHeight: '1.8'
                            }}>
                                <li style={{ color: validation.hasMinLength ? '#10b981' : '#6b7280' }}>
                                    At least 8 characters
                                </li>
                                <li style={{ color: validation.hasNumber ? '#10b981' : '#6b7280' }}>
                                    Must include 1 number
                                </li>
                                <li style={{ color: validation.hasSymbol ? '#10b981' : '#6b7280' }}>
                                    Must include 1 symbol (e.g., !@#$%)
                                </li>
                            </ul>
                        </div>
                        {/* New Password */}

                        <div style={{ marginBottom: '8px' }}>


                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                New Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '15px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}

                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#0891b2',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '8px'
                            }}>
                                Confirm Password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '15px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: 'rgb(4 57 105)',
                                color: '#ffffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.2s'
                            }}

                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>


                    </form>
                </>
                //confirmation code 
                //email 
                // reset email 
            )}
        </div>
    );
}
