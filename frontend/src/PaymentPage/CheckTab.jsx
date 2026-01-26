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


export const CheckTab = (
    { 
        amount, 
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
            isDevelopment: import.meta.env.VITE_ENV === 'development'
        };
         const clientid =
            (context ?? "app") === "app"
                ? BaseUrl().split('.')[0].split('//')[1]
                : (context ?? "ins-dev");
        try {
            let responseBody = null;
            if (isPortal) {
                responseBody = await fetchWithAuth("make-check-payment-to-cardknox", request);
            }
            else {
            
            const response = await fetch(`${BaseUrl()}/pay/${clientid.replace("test", "ins-dev")}/make-check-payment-to-cardknox`, {
                method: 'POST',
                body: JSON.stringify(request),
                headers: { 'Content-Type': 'application/json' }
            });
             responseBody = await response.json();
        }
            if (responseBody.xStatus == "Approved" ) {
               if(!isPortal) window.location.href = `https://${clientid.replace("test", "ins-dev")}.instechpay.co/app/thank-you?amount=${amount}`;
               else onFinish(); 
                
            }
            
            else {
                const currentUrl = window.location.origin + window.location.pathname;;
                const params = new URLSearchParams({
                    account: accountCode,
                    amount: amount,
                    invoiceid: invoiceID,
                    error: `Error proccessing transaction. ${responseBody.xError} Please try again.`
                });
                window.location.href = `${currentUrl}?${params.toString()}`;


            }
            if (responseBody.xResult === 'V')
                verify3DS(responseBody);
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div>
            <div>
                    `<div className="form-group" >
                        <label className="form-label" >Select Account Type: </label>
                        <select className="form-input" id="accountType" value={accountType} onChange={handleAccountTypeChange}>
                            <option value="checking">Checking</option>
                            <option value="savings">Savings</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="account-name" className="form-label">Account Holder Name</label>
                        <input
                            type="text"
                            id="account-name"
                            name="account-name"
                            placeholder="Account Name"
                            className={`form-input ${submitPressed && accountName == "" ? "invalid" : ""}`}
                            onChange={(e) => setAccountName(e.target.value)}
                        />
                        {submitPressed && accountName == "" ? <div className="toast show" id="toast-for-account-holder">Account holder name required.</div> : ''}

                    </div>
                    <div className="form-group">
                        <label htmlFor="account-number" className="form-label">Account Number</label>
                          <CardnoxField
                            
                            ifieldType={ACH_TYPE}
                             onToken={onCheckToken}
                            handle3DSResults={verify3DS}
                            ref={checkRef}
                            className={`ifields`}
                            ifieldsKey={ifieldsKey}
                        />
                        {submitPressed && checkToken == "" ? <div className="toast show" id="toast-for-account-number">Account number required.</div> : ''}

                    </div>

                    <div className="form-group">
                        <label htmlFor="routing-number" className="form-label">Routing Number</label>
                        <input
                            type="text"
                            id="routing-number"
                            placeholder="Routing"
                            name="routing-number"
                            className={`form-input ${submitPressed && routingNumber == "" ? "invalid" : ""}`}
                            onChange={(e) => setRoutingNumber(e.target.value)}
                        />
                        {submitPressed && routingNumber == "" ? <div className="toast show" id="toast-for-routing-number">Routing number required.</div> : ''}

                    </div>
`

                {
                    !isPortal &&
                    <>
                        <div className="achagree achField">

                            <div >
                                <div id="ps-group-ps-ach-auth"
                                    className="ps-group ps-style-full" data-gid="35267" data-key="ps-ach-auth">

                                    <div
                                        className="ps-contract"
                                        data-agreed="true"
                                    >
                                        <div style={{ fontSize: "larger" }}>ACH Authorization</div>
                                        <div >
                                            <table className="ps-contract-options-links">
                                                <tbody><tr>
                                                    <td className="ps-contract-options-left">
                                                        <div className="ps-expand-button" style={{ display: "none" }}>Expand Contract</div>
                                                    </td>

                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div style={{ paddingBottom: "40px" }} >
                                            <div style={{ display: (achChecked ? "none" : "block") }} >
                                                <span style={{ backgroundColor: "initial" }} cursorposition="890">
                                                    I hereby authorize this company to debit my bank account through the electronic Automated Clearing House (ACH) network within one to three business days from the payment date for the amount or payment plan amount listed above. I am aware that in the event this company is unable to secure funds from my bank account for this transaction for any reason, including but not limited to insufficient funds in my account or insufficient or inaccurate information I provided when I submitted the electronic payment, further collection action may be undertaken by this company, including the application of returned check fees to the extent permitted by law. If my bank returns the payment, I am still responsible for making a payment to this company. If this is a recurring schedule, I understand this will remain in effect until a written request is submitted to this company requesting a change.
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ach-checkbox-container" style={{
                                            border: "1px solid lightblue",
                                            fontSize: 'smaller'

                                        }}>

                                            <div className="ach-checkbox-wrapper">
                                                <input type="checkbox" id="ach-agree" name="ach-agree" required="" onChange={handleCheckboxChange} />
                                            </div>

                                            <label htmlFor="ach-agree">I acknowledge that I have read, understand and agree to the full terms and conditions set forth above.</label>

                                        </div>
                                        {
                                            submitPressed && !achChecked ?
                                                <div className="toast show" id="toast-for-ach-agreement">ACH Authorization must be checked.</div>
                                                : <></>
                                        }
                                    </div>
                                </div>
                            </div>

                            <br />
                        </div>
                        <div style={{ padding: "25px" }} >
                            <ReCAPTCHA
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                onChange={(token) => setCaptchaToken(token)}
                            />
                            {(captchaToken == '' || captchaToken == null) && submitPressed ? <div className="toast show" id="toast-for-recap">Recaptcha check required.</div> : ''}

                        </div>
                    </>
                }
                {showProcess &&<> <div id="total">
                    Your Total: <span id="total-amount">{FormatCurrency(parseFloat(amount))}</span>
                </div>


                <div className="button-spaced mt-3">
                    <button className="btn btn-primary" type="button" onClick={submitToGateway}>
                        <FontAwesomeIcon icon={faCreditCard} style={{ paddingRight: '5px' }} />
                        Process Payment
                    </button>
                </div>

                </>
    }
            </div>
        </div>


    )
};

