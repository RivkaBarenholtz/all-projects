import React, { useState, useRef } from "react";
import { FormatCurrency, BaseUrl } from '../Utilities';
import CardnoxField from './CardnoxField';
import GooglePay from './GooglePay';
import ExpirationDateField from './ExpirationDateField';
import Select from "react-select";
import { CARD_TYPE, CVV_TYPE } from '@cardknox/react-ifields';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faShieldAlt } from '@fortawesome/free-solid-svg-icons';



export const CreditCardTab = (
    { 
        amount, 
        surcharge, 
        surchargeAmount, 
        accountCode, 
        accountValid, 
        invoiceID, 
        csrCode, 
        csrEmail, 
        ifieldsKey, 
        cardHolderName, 
        billingAddress, 
        state, 
        city, 
        notes, 
        phone, 
        email, 
        zip, 
        setEverythingFocused,
        selectCustomStyles, 
        isPortal, 
        onFinish ,
        showProcess = true 
    }) => {


    const [issuer, setIssuer] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const [cardToken, setCardToken] = useState('');
    const [cvvToken, setCvvToken] = useState('');
    const [focusedField, setFocusedField] = useState('');
    const [ccValid, setCcValid] = useState(true);
    const [expMonth, setExpMonth] = useState('');
    const [expYear, setExpYear] = useState('');
    const [cvvValid, setCvvValid] = useState(true);
    const [submitPressed, setSubmitPressed] = useState(false);

    const cardRef = useRef();
    const cvvRef = useRef();


    const onCardToken = (data) => {
        setCardToken(data.xToken);
    };

    const onCvvToken = (data) => {

        setCvvToken(data.xToken);
    };
    addIfieldKeyPressCallback(function (data) {

        if (data.lastIfieldChanged === 'card-number' && data.cardNumberIsValid !== undefined) {
            setCcValid(data.cardNumberIsValid);
            if (!ccValid)
                setCardToken('');
        }
        if (data.lastIfieldChanged === 'cvv' && data.cvvIsValid !== undefined) {
            setCvvValid(data.cvvIsValid);
            if (!cvvValid)
                setCvvToken('');
        }
    });


    const onFocusChanged = (eventName, field) => {
        if (eventName == "focus") {
            setFocusedField(field);
            console.log(focusedField);
        }
        if (eventName == "blur") {
            setFocusedField('');
        }
    }

    const navigate = useNavigate();


    const verify3DS = (verifyData) => {
        window.ck3DS.verifyTrans(verifyData);
    }
    const setInvalidFields = () => {
        if (cardToken == "") {
            setCcValid(false);
        }
        if (cvvToken == "") {
            setCvvValid(false);
        }
        setSubmitPressed(true);
        setEverythingFocused();
    }
    const months = [
        { value: "01", label: "01" },
        { value: "02", label: "02" },
        { value: "03", label: "03" },
        { value: "04", label: "04" },
        { value: "05", label: "05" },
        { value: "06", label: "06" },
        { value: "07", label: "07" },
        { value: "08", label: "08" },
        { value: "09", label: "09" },
        { value: "10", label: "10" },
        { value: "11", label: "11" },
        { value: "12", label: "12" },
    ];

    const currentYear = new Date().getFullYear();

    const years = Array.from({ length: 11 }, (_, i) => {
        const fullYear = currentYear + i;
        const twoDigitYear = (fullYear % 100).toString().padStart(2, '0');
        return { value: twoDigitYear, label: fullYear.toString() };
    });
    const submitToGateway = async () => {

        setInvalidFields();
        //setAccountFocused(true); //even if it wasn't focused on yet we want it to behave as if it was because submit was pressed 
        if ((captchaToken == "" || captchaToken == null) && !isPortal) {
            // alert("Please verify that you are not a robot");
            return;
        }
        if (!ccValid || expMonth == '' || expYear == '' || !cvvValid || !accountValid) return;
        let request = {
            CardHolderName: cardHolderName,
            Zip: zip,
            BillingAddress: billingAddress,
            City: city,
            State: state,
            Email: email,
            Notes: notes,
            Phone: phone,
            Subtotal: amount,
            Surcharge: surchargeAmount,
            CardNumber: cardToken,
            AccountID: accountCode,
            ExpDate: `${expMonth.value}${expYear.value}`,
            InvoiceNumber: invoiceID,
            CVV: cvvToken,
            CSRCode: csrCode,
            CSREmail: csrEmail,
            CaptchaToken: captchaToken,
            isDevelopment: import.meta.env.DEV
        };

        try {
            const response = await fetch(`${BaseUrl()}/pay/make-payment-cardknox`, {
                method: 'POST',
                body: JSON.stringify(request),
                headers: { 'Content-Type': 'application/json' }
            });
            const responseBody = await response.json();
            if (responseBody.xStatus == "Approved") {

               if(!isPortal) navigate("/thank-you")
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
            //setGatewayResponse(error);
        }
    }

    return (
        <div>
            <div className="form-group">
                <label className="form-label">Card Number:</label>
                <CardnoxField
                    onFocusedChanged={(focused) => {
                        onFocusChanged(focused, "CardNumber")
                    }}
                    ifieldType={CARD_TYPE}
                    onIssuer={setIssuer}
                    onToken={onCardToken}
                    handle3DSResults={verify3DS}
                    ref={cardRef}
                    className={` ${!ccValid && focusedField !== "CardNumber" ? 'invalid' : ''} ifields`}
                    ifieldsKey={ifieldsKey}
                />
                {!ccValid && focusedField !== "CardNumber" ? <div className="toast show" id="toast-for-cardnumber">Valid card number required.</div> : ''}

            </div>

            <div className="form-row">
                <div className="form-group form-col">
                    <label className="form-label">MM:</label>
                    {/* <ExpirationDateField 
                        value={expirationDate} 
                        onChange={setExpirationDate} 
                        isValid={setExpValid}> 
                    </ExpirationDateField>  
                                            */}

                    <Select
                        inputId="month"
                        options={months}
                        value={expMonth}
                        onChange={setExpMonth}
                        isClearable={false}
                        placeholder=""
                        styles={selectCustomStyles}
                        components={{
                            IndicatorSeparator: () => null  // This removes the vertical line separator
                        }}
                        className={`${expMonth == '' && submitPressed ? "invalid" : ""} select-input`}
                    />
                    {expMonth == '' && submitPressed ? <div className="toast show" id="toast-for-expMonth">Expiration month required.</div> : ''}

                </div>
                <div className="form-group ">
                    <label className="form-label">YY:</label>
                    {/* <ExpirationDateField 
                                    value={expirationDate} 
                                    onChange={setExpirationDate} 
                                    isValid={setExpValid}> 
                                </ExpirationDateField>  
                                                        */}

                    <Select
                        inputId="year"
                        options={years}
                        value={expYear}
                        onChange={setExpYear}
                        isClearable={false}
                        placeholder=""
                        styles={{
                            ...selectCustomStyles,
                            control: (provided, state) => ({
                                ...selectCustomStyles.control(provided, state),
                                minWidth: '100px'  // override minWidth
                            }
                            ),
                            menu: (provided, state) => ({
                                ...selectCustomStyles.menu(provided, state),
                                minWidth: '8ch'  // override minWidth
                            }
                            )
                        }}
                        className={`${expYear == '' && submitPressed ? "invalid" : ""} select-input`}

                        classNamePrefix="Select"
                        components={{
                            IndicatorSeparator: () => null  // This removes the vertical line separator
                        }}
                    />
                    {expYear == '' && submitPressed ? <div class="toast show" id="toast-for-expYear">Expiration year required.</div> : ''}

                </div>
                <div className="form-group form-col">
                    <label className="form-label">CVV:</label>
                    <CardnoxField
                        onFocusedChanged={(focused) => {
                            onFocusChanged(focused, "CVV")
                        }}
                        ifieldType={CVV_TYPE}
                        issuer={issuer}
                        onToken={onCvvToken}
                        ref={cvvRef}
                        className={`${!cvvValid && focusedField !== "CVV" ? 'invalid' : ''}  ifields`}
                        ifieldsKey={ifieldsKey}
                    />

                    {!cvvValid && focusedField !== "CVV" ? <div className="toast show" id="toast-for-cvv">Valid CVV required.</div> : ''}
                </div>


            </div>

            <div className="form-group">
            </div>

            {
                !isPortal && 
                <div style={{ padding: "25px" }} >
                    <ReCAPTCHA
                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                        onChange={(token) => setCaptchaToken(token)}
                    />
                    {captchaToken == '' && submitPressed ? <div className="toast show" id="toast-for-recap">Recaptcha check required.</div> : ''}

                </div>
            }

            {showProcess && <><section className="payment-total-section">
                <h3 className="">Total</h3>
                <div className="payment-total-line" id="sub-total-line">
                    <span>Subtotal:</span>
                    <span >{FormatCurrency((amount))}</span>
                </div>

                <div className="payment-total-line" id="convenience-fee-line">
                    <span>Electronic Transfer Fee:</span>
                    <span id="convenience-fee">{FormatCurrency((surchargeAmount))}</span>
                </div>
                <div className="payment-total-line grand-total">
                    <span id="grand-total-label">Grand Total:</span>
                    <span id="grand-total">{FormatCurrency(parseFloat(amount) + (surchargeAmount))}</span>
                </div>
            </section>

            {/* {amount > 0 && !isNaN(surcharge) && accountValid ? <GooglePay amount={amount} surcharge={surcharge} AccountID={accountCode} captchaToken={captchaToken} cardHolderName={cardHolderName} csrCode={csrCode} csrEmail={csrEmail} invoiceID={invoiceID} zip={zip} /> : <></>} */}

            <div className="button-spaced mt-3">
                <button className="btn btn-primary" type="button" onClick={submitToGateway}>
                    <FontAwesomeIcon icon={faCreditCard} style={{ paddingRight: '5px' }} />
                    Process Payment
                </button>
            </div>
            <p className="secure-info">
                <FontAwesomeIcon icon={faShieldAlt}
                    style={
                        {
                            color: 'var(--success-color)',
                            marginRight: '5px'
                        }}>

                </FontAwesomeIcon>
                100% Secure <br /> SSL encryption &amp; PCI compliant
            </p>
            </>}
        </div>


    )
};

