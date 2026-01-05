import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import { BaseUrl } from "../Utilities";
import { CopyIcon } from "../FilterObjects/CopyIcon";
import ReCAPTCHA from "react-google-recaptcha";
import { useParams } from "react-router-dom";

export const WireTab = ({
    bankInfo,
    accountId,
    invoiceNumber,
    amount,
    notes,
    name,
    billingAddress,
    city,
    state,
    zip,
    phone,
    email,
    csrCode,
    csrEmail,
    refNum,
    validateAmount
}) => {
    const [confNumber, setConfNumber] = useState("");
    //const [accountName , setAccountName] =  useState("");
    //const [date , setDate] =  useState("");
    const [captchaToken, setCaptchaToken] = useState('');
    const [submitPressed, setSubmitPressed] = useState(false);
    const [showSubmit, setShowSubmit] = useState(true);
    const { context } = useParams();
    const navigate = useNavigate();
    const SubmitWire = async () => {
        setShowSubmit(false);
        setSubmitPressed(true);
        validateAmount();
        if (confNumber == "" || amount <= 0 || (!import.meta.env.VITE_ENV === 'development' && (captchaToken == null || captchaToken == '' || captchaToken == ""))) {
            setShowSubmit(true);
            return;
        }
        const submitWireReq = {
            RefNumber: refNum,
            //AccountName : accountName , 
            ConfNumber: confNumber,
            //DateSent : date, 
            AccountId: accountId,
            InvoiceNumber: invoiceNumber,
            Amount: amount,
            Notes: notes,
            CustomerName: name,
            BillingAddress: billingAddress,
            City: city,
            State: state,
            Zip: zip,
            Phone: phone,
            Email: email,
            CsrCode: csrCode,
            CsrEmail: csrEmail,
            CaptchaToken: captchaToken,
            isDevelopment: import.meta.env.VITE_ENV === 'development'
        }

        const clientid =
            (context ?? "app") === "app"
                ? BaseUrl().split('.')[0].split('//')[1]
                : (context ?? "ins-dev");

        await fetch(`${BaseUrl()}/pay/${clientid.replace("test", "ins-dev")}/submit-wire`, {
            method: 'POST',
            body: JSON.stringify(submitWireReq),
            headers: { 'Content-Type': 'application/json' }
        });


         window.location.href = `https://${clientid.replace("test", "ins-dev")}.instechpay.co/app/thank-you?amount=${submitWireReq.Amount}`;
        //call back end which 
        // 1. saves our payment 


        // 2. sends email to CSR if there is one & default email
        // 3. ? inserts into epic (maybe should be seperate endpoint)
    }



    return <div style={{ textAlign: "left", fontSize: "12px" }}>
        <h3>1. Send Wire</h3>
        <p>
            Send the wire transfer directly from your bank using the recipient details provided below.
        </p>
        <p>
            Click on the copy button to copy encrypted information to your clipboard.
        </p>

        <div className="wire-box">
            <div>Bank Name: <strong>{bankInfo.BankName}</strong></div>
            <div>Bank Address:<strong>{bankInfo.Address} <div> {bankInfo.CityStateZip} </div></strong> </div>

            <div>Account #:<strong> {bankInfo.AccountNum?.length > 4
                ? "x".repeat(bankInfo.AccountNum.length - 4) + bankInfo.AccountNum.slice(-4)
                : bankInfo.AccountNum}
                <CopyIcon copyText={bankInfo.AccountNum} title={"Copy Account Number"} /> </strong></div>
            <div>Routing/ABA #:<strong> {bankInfo.Routing?.length > 4
                ? "x".repeat(bankInfo.Routing.length - 4) + bankInfo.Routing.slice(-4)
                : bankInfo.Routing}
                <CopyIcon copyText={bankInfo.Routing} title={"Copy Routing Number"} /> </strong> </div>
            <div>Unique Reference Number:<strong><span >{refNum}</span>  <CopyIcon title={"Copy reference number"} copyText={refNum} /> </strong> </div>

            <div className="alert red">
                <strong>Required:</strong> Please enter above reference number in the wire transfer Memo or Notes field.
            </div>
            <div className="alert red">
                <strong>Disclaimer:</strong> GNP Brokerage is not responsible for funds sent to an incorrect account. Please verify all wiring information before initiating the transfer.
            </div>
        </div>
        <h3>2. Confirm Wire</h3>
        {/* <div className="form-group">
                <label className="form-label">Legal Name on Bank Account</label>
                <input
                    type="text"
                    id="account-name"
                    name="account-name"
                    className={`form-input`}
                    onChange={(e) => setAccountName(e.target.value)}
                />
                {submitPressed && accountName==""?<div className="toast show" id="toast-for-account-holder">Account name required.</div>:''} 
            
            </div> */}
        <div>
            Enter your bank’s wire confirmation number shown on your bank's screen once the wire is completed.
        </div>
        <div className="form-group">
            <label className="form-label-bold">Confirmation Number</label>
            <input
                type="text"
                id="conf-number"
                name="conf-number"
                className={`form-input`}
                onChange={(e) => setConfNumber(e.target.value)}
            />
            {submitPressed && confNumber == "" ? <div className="toast show" id="toast-for-account-holder">Confirmation number required. If you don't have one enter ''-''</div> : ''}

        </div>

        <div style={{ padding: "25px" }} >
            <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
            />
            {(captchaToken == '' || captchaToken == null) && submitPressed ? <div className="toast show" id="toast-for-recap">Recaptcha check required.</div> : ''}

        </div>
        {/* 
            <div className="form-group">
                <label className="form-label-bold">Date Sent</label>
                <input
                    type="date"
                    id="date-sent"
                    name="date-sent"
                    className={`form-input`}
                    onChange={(e) => setDate(e.target.value)}
                />
              
            </div> */}


        <div className="button-spaced mt-3">
            {showSubmit && <button className="btn btn-primary" type="button" onClick={SubmitWire} >
                Submit Wire Confirmation
            </button>}
        </div>
    </div>
}