import React, { useState, useRef } from "react";
import { FormatCurrency, BaseUrl } from '../Utilities';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { useParams } from 'react-router-dom';
import CardnoxField from "./CardnoxField";
import { on } from "process";
import { ACH_TYPE } from "@cardknox/react-ifields";
import { fetchWithAuth } from "../Utilities";


const ProcessButton = ({ onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        backgroundColor: hovered ? '#005ea6' : '#0070ba',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '18px 24px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        letterSpacing: '0.3px',
        marginTop: '16px',
        transition: 'background-color 0.18s ease, box-shadow 0.18s ease',
        boxShadow: hovered ? '0 6px 20px rgba(0,112,186,0.35)' : '0 2px 8px rgba(0,112,186,0.18)',
      }}
    >
      <FontAwesomeIcon icon={faCreditCard} style={{ paddingRight: '8px' }} />
      Process Payment
    </button>
  );
};

export const CheckTab = (
    { 
        amount, 
        vendor, 
        accountCode, 
        csrCode, 
        csrEmail, 
        invoiceID, 
        setEverythingFocused, 
        cardHolderName, 
        billingAddress, 
        state, 
        city, 
        notes, 
        phone, 
        email, 
        zip, 
        isPortal, 
        onFinish,
        onError, 
        ifieldsKey,
        showProcess = true  
    }) => {
    const [accountName, setAccountName] = useState('');
    const [checkToken, setCheckToken] = useState('');
    const [routingNumber, setRoutingNumber] = useState('');
    const [accountType, setAccountType] = useState('checking');
    const [captchaToken, setCaptchaToken] = useState('');
    const [submitPressed, setSubmitPressed] = useState(false);

    const checkRef = useRef();

    const handleAccountTypeChange = (event) => {
        setAccountType(event.target.value);
    };

    
    const verify3DS = (verifyData) => {
        window.ck3DS.verifyTrans(verifyData);
    }
    const [achChecked, setAchChecked] = useState(false);

    const navigate = useNavigate();

    const handleCheckboxChange = () => {
        setAchChecked(!achChecked)
    }
     const { context } = useParams();

       const onCheckToken = (data) => {
        setCheckToken(data.xToken);
    };


    const submitToGateway = async () => {
        setEverythingFocused();
        setSubmitPressed(true);
        //setAccountFocused(true); //even if it wasn't focused on yet we want it to behave as if it was because submit was pressed 
        if (!achChecked && !isPortal) {
            //alert("Please agree to terms and conditions");
            return;
        }
        if ((captchaToken == "" || captchaToken == null) && !isPortal && import.meta.env.VITE_ENV !== 'development') {
            //alert("Please verify that you are not a robot");
            return;
        }
        if (checkToken == "" || routingNumber == "" || accountCode == "")
            return;

        let request = {
            CardHolderName: cardHolderName,
            Zip: zip,
            BillingAddress: billingAddress,
            City: city,
            State: state,
            Email: email,
            Notes: notes,
            Phone: phone,
            AccountNumber: checkToken,
            Amount: amount,
            RoutingNumber: routingNumber,
            AccountType: accountType,
            AccountID: accountCode,
            InvoiceNumber: invoiceID,
            AccountName: accountName,
            CSRCode: csrCode,
            CSREmail: csrEmail,
            CaptchaToken: captchaToken,
            Software: isPortal ? "Instech-Pay-Portal" : "Instech-Payment-Site",
            isDevelopment: import.meta.env.VITE_ENV === 'development'
        };
         
        try {
            let responseBody = null;
            if (isPortal) {
                responseBody = await fetchWithAuth("make-check-payment-to-cardknox", request);
            }
            else {
            
            const response = await fetch(`${BaseUrl()}/pay/${vendor.subdomain}/make-check-payment-to-cardknox`, {
                method: 'POST',
                body: JSON.stringify(request),
                headers: { 'Content-Type': 'application/json' }
            });
             responseBody = await response.json();
        }
            if (responseBody.xStatus == "Approved" ) {
               if(!isPortal) window.location.href = `https://portal.instechpay.co/thank-you?amount=${amount}`;
               else onFinish(); 
                
            }
            
            else {
               onError(`❌ ${responseBody.xMessage || "Payment was not approved." }`);


            }
            if (responseBody.xResult === 'V')
                verify3DS(responseBody);
        } catch (error) {
            onError("❌ An error occurred while processing the payment. Please try again.");
            console.error(error);
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Account Type + Holder Name — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Account Type</label>
                    <select className="form-input" id="accountType" value={accountType} onChange={handleAccountTypeChange}>
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                    </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="account-name" className="form-label">Account Holder</label>
                    <input
                        type="text"
                        id="account-name"
                        placeholder="Full name"
                        className={`form-input ${submitPressed && accountName === '' ? 'invalid' : ''}`}
                        onChange={(e) => setAccountName(e.target.value)}
                    />
                </div>
            </div>
            {submitPressed && accountName === '' && (
                <div className="toast show">Account holder name required.</div>
            )}

            {/* Account Number + Routing — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Account Number</label>
                    <CardnoxField
                        ifieldType={ACH_TYPE}
                        onToken={onCheckToken}
                        handle3DSResults={verify3DS}
                        ref={checkRef}
                        className="ifields"
                        ifieldsKey={ifieldsKey}
                    />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="routing-number" className="form-label">Routing Number</label>
                    <input
                        type="text"
                        id="routing-number"
                        placeholder="Routing"
                        className={`form-input ${submitPressed && routingNumber === '' ? 'invalid' : ''}`}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                    />
                </div>
            </div>
            {submitPressed && (checkToken === '' || routingNumber === '') && (
                <div className="toast show">Account number and routing number required.</div>
            )}

            {/* ACH Authorization */}
            {!isPortal && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#475569' }}>
                    <div style={{ maxHeight: achChecked ? '0' : '72px', overflow: 'hidden', transition: 'max-height 0.2s ease', marginBottom: achChecked ? '0' : '8px', lineHeight: '1.5' }}>
                        I authorize this company to debit my bank account via ACH within 1–3 business days. I understand returned payments may incur fees and I remain responsible for the amount owed.
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', color: '#1e293b' }}>
                        <input type="checkbox" id="ach-agree" onChange={handleCheckboxChange} style={{ accentColor: '#0070ba' }} />
                        I agree to the ACH authorization terms
                    </label>
                    {submitPressed && !achChecked && (
                        <div className="toast show" style={{ marginTop: '6px' }}>ACH authorization must be accepted.</div>
                    )}
                </div>
            )}

            {/* reCAPTCHA */}
            {!isPortal && (
                <div>
                    <ReCAPTCHA
                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                        onChange={(token) => setCaptchaToken(token)}
                    />
                    {submitPressed && (captchaToken === '' || captchaToken == null) && (
                        <div className="toast show">Recaptcha check required.</div>
                    )}
                </div>
            )}

            {/* Submit */}
            {showProcess && <ProcessButton onClick={submitToGateway} />}
        </div>
    )
};

