import React, { use, useRef, useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { FormatCurrency, BaseUrl, fetchWithAuth, DownloadPolicyDocument } from '../Utilities';
import { useSearchParams, useParams } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import Select from "react-select";
import PaymentTabs from './PaymentTabs';
import { CreditCardTab } from './CreditCardTab';
import { WireTab } from './WireTab.jsx';
import { CheckTab } from './CheckTab.jsx';
import Loader from './Loader.jsx';
import { set } from 'date-fns';
import { ConfirmationModal } from '../Objects/ConfimationModal.jsx';
import { FinanceTab } from './FinanceTab.jsx';
import { PolicySigner } from './PolicySigner.jsx';



export default function PaymentForm({ isPortal, onSuccess }) {



  const { context } = useParams();
  // const [status, setStatus] = useState("loading");






  const [searchParams] = useSearchParams();
  const accountID = searchParams.get("account") ?? "";
  const invoiceAmount = searchParams.get("amount") ?? null;
  const epicClientNumber = searchParams.get("accountid") ?? 0;
  const invoiceIDparam = searchParams.get("invoiceid") ?? "";
  const policyId = searchParams.get("policyid") ?? "";
  const errorCode = searchParams.get("error") ?? "";
  const csrEmail = searchParams.get("csremail")
  const csrCode = searchParams.get("csrcode")


  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 768px)' });


  const accountIDIsEditable = accountID == "";
  const invoiceIdIsEditable = invoiceIDparam == 0;

  const [error, setError] = useState(errorCode);
  const [amount, setAmount] = useState(invoiceAmount);
  const [vendor, setVendor] = useState({});
  const [surcharge, setSurcharge] = useState({});
  const [invoice, setInvoice] = useState(null);
  const [accountCode, setAccountCode] = useState(accountID);
  const [cardholderName, setCardHolderName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [invoiceID, setInvoiceID] = useState(invoiceIDparam ?? "");
  const [amountIsEditable, setAmountIsEditable] = useState(true);
  const [eSignData, setESignData] = useState(null); // { capturedSignature, signerName, signerEmail, auditTrail }
  const [submitPressed, setSubmitPressed] = useState(false);
  const [showSigner, setShowSigner] = useState(false);


  const [focusedField, setFocusedField] = useState('')
  const [accountFocused, setAccountFocused] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [amountFocused, setAmountFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInvLoading, setIsInvLoading] = useState(false);
  const [amntDisplayValue, setAmntDisplayValue] = useState(FormatCurrency(amount));
  const [state, setState] = useState('');
  const [activeTab, setActiveTab] = useState("Credit Card");

  const [refNum, setRefNum] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");


  const setEverythingFocused = () => {
    setAccountFocused(true);
    setAmountFocused(true);
  }

  const handleSelectChange = (index) => {
    const updated = [...invoice];
    updated[index].Selected = !updated[index].Selected;
    setInvoice(updated);
  };

  const handleInvoiceAmountChange = (index, newVal) => {
    const raw = newVal.replace(/[^0-9.]/g, '');

    const updated = [...invoice];
    updated[index].Balance = Number(raw);
    updated[index].AmountDisplay = Number(raw);
    setInvoice(updated);
  };


  const onError = (message) => {
    setMessage(message);
    setShowModal(true);
  }

  const hasESign = !!(policy?.SignatureFields?.length > 0 && policy?.PdfUrl);

  const handlePaymentApproved = async (totalAmount) => {
    if (eSignData) {
      try {
        const res = await fetch(`${BaseUrl()}/pay/${vendor?.subdomain}/sign-policy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policyId: policy.PolicyId.replace("Policy#", ""),
            signatureData: eSignData.capturedSignature.data,
            signatureType: eSignData.capturedSignature.type,
            signerName: eSignData.signerName,
            signerEmail: eSignData.signerEmail,
            auditTrail: eSignData.auditTrail,
          }),
        });
        if (!res.ok) {
          onError("❌ Payment was approved but signature submission failed. Please contact support.");
          return;
        }
      } catch {
        onError("❌ Payment was approved but signature submission failed. Please contact support.");
        return;
      }
    }
    if (!isPortal) {
      const policyParam = hasESign && policy?.PolicyId ? `&policyid=${policy.PolicyId.replace("Policy#", "")}` : "";
      window.location.href = `https://${vendor?.subdomain}.instechpay.co/app/thank-you?amount=${totalAmount}&subdomain=${vendor?.subdomain}${policyParam}`;
    } else {
      onSuccess();
    }
  };


  const handleSignAndPay = () => {
    if (activeTab === "Credit Card") cardtabRef.current?.submitToGateway();
    else if (activeTab === "eCheck") checktabRef.current?.submitToGateway();
    else if (activeTab === "Wire Funds") wiretabRef.current?.submitToGateway();
  };

  const [accountValid, setAccountValid] = useState(true);

  const amountRef = useRef(null);
  const accountRef = useRef(null);

  const checktabRef = useRef(null);

  const wiretabRef = useRef(null);
  const cardtabRef = useRef(null);

  const customStyles = {
    menuList: (provided) => ({
      ...provided,
      maxHeight: '150px', // optional: restrict height
      overflowY: 'auto',
      scrollbarWidth: 'none', // Firefox
      msOverflowStyle: 'none', // IE/Edge
    }),
    menu: (provided) => ({
      ...provided,
      overflow: 'hidden',
      maxWidth: '5ch'
    }),
    control: (provided) => ({
      ...provided,
      maxWidth: '12ch',
      minWidth: '90px',
      padding: '4px 0px'

    }),
  };



  const states = [
    { value: "AL", label: "AL" },
    { value: "AK", label: "AK" },
    { value: "AZ", label: "AZ" },
    { value: "AR", label: "AR" },
    { value: "CA", label: "CA" },
    { value: "CO", label: "CO" },
    { value: "CT", label: "CT" },
    { value: "DE", label: "DE" },
    { value: "FL", label: "FL" },
    { value: "GA", label: "GA" },
    { value: "HI", label: "HI" },
    { value: "ID", label: "ID" },
    { value: "IL", label: "IL" },
    { value: "IN", label: "IN" },
    { value: "IA", label: "IA" },
    { value: "KS", label: "KS" },
    { value: "KY", label: "KY" },
    { value: "LA", label: "LA" },
    { value: "ME", label: "ME" },
    { value: "MD", label: "MD" },
    { value: "MA", label: "MA" },
    { value: "MI", label: "MI" },
    { value: "MN", label: "MN" },
    { value: "MS", label: "MS" },
    { value: "MO", label: "MO" },
    { value: "MT", label: "MT" },
    { value: "NE", label: "NE" },
    { value: "NV", label: "NV" },
    { value: "NH", label: "NH" },
    { value: "NJ", label: "NJ" },
    { value: "NM", label: "NM" },
    { value: "NY", label: "NY" },
    { value: "NC", label: "NC" },
    { value: "ND", label: "ND" },
    { value: "OH", label: "OH" },
    { value: "OK", label: "OK" },
    { value: "OR", label: "OR" },
    { value: "PA", label: "PA" },
    { value: "RI", label: "RI" },
    { value: "SC", label: "SC" },
    { value: "SD", label: "SD" },
    { value: "TN", label: "TN" },
    { value: "TX", label: "TX" },
    { value: "UT", label: "UT" },
    { value: "VT", label: "VT" },
    { value: "VA", label: "VA" },
    { value: "WA", label: "WA" },
    { value: "WV", label: "WV" },
    { value: "WI", label: "WI" },
    { value: "WY", label: "WY" }
  ];

  const paymentTabData = vendor.CardknoxIFeildsKey ? {
    "Credit Card":
      <CreditCardTab
        amount={invoice && invoice.length > 1 ? invoice.reduce((sum, item) => sum + (item.Selected || item.Selected == undefined ? item.Balance : 0), 0) : amount}
        surcharge={surcharge.surcharge}
        surchargeAmount={invoice && invoice.length > 1 ? invoice.reduce((sum, item) => sum + (item.Selected || item.Selected == undefined ? item.Balance * item.Surcharge : 0), 0) : amount * surcharge.surcharge}
        accountValid={accountValid}
        invoiceID={invoiceID}
        accountCode={accountCode}
        csrCode={csrCode}
        csrEmail={csrEmail}
        cardHolderName={cardholderName}
        zip={zip}
        billingAddress={billingAddress}
        city={city}
        state={state}
        email={email}
        notes={notes}
        phone={phone}
        ifieldsKey={vendor.CardknoxIFeildsKey}
        setEverythingFocused={setEverythingFocused}
        selectCustomStyles={customStyles}
        isPortal={isPortal}
        onFinish={onSuccess}
        onError={onError}
        subdomain={vendor.subdomain}
        submitPressed={submitPressed}
        setSubmitPressed={setSubmitPressed}
        hidePaymentButton={hasESign}
        onPaymentApproved={hasESign ? handlePaymentApproved : undefined}
        policyId={policyId}
        ref={cardtabRef}
      />,
    "eCheck":
      <CheckTab
        amount={invoice && invoice.length > 1 ? invoice.reduce((sum, item) => sum + (item.Selected ? item.Balance : 0), 0) : amount}
        accountCode={accountCode}
        cardHolderName={cardholderName}
        zip={zip}
        billingAddress={billingAddress}
        city={city}
        state={state}
        email={email}
        notes={notes}
        phone={phone}
        csrCode={csrCode}
        csrEmail={csrEmail}
        invoiceID={invoiceID}
        setEverythingFocused={setEverythingFocused}
        isPortal={isPortal}
        onFinish={onSuccess}
        onError={onError}
        ifieldsKey={vendor.CardknoxIFeildsKey}
        subdomain={vendor.subdomain}
        submitPressed={submitPressed}
        setSubmitPressed={setSubmitPressed}
        hidePaymentButton={hasESign}
        policyId={policyId}
        onPaymentApproved={hasESign ? handlePaymentApproved : undefined}
        ref={checktabRef}
      />,
    "Finance": <FinanceTab submitPressed={submitPressed} setSubmitPressed={setSubmitPressed} amount={amount} />,
    ...(vendor.BankInfo && !isPortal && {
      "Wire Funds":
        <WireTab
          refNum={refNum}
          bankInfo={vendor.BankInfo}
          accountId={accountCode}
          amount={amount}
          billingAddress={billingAddress}
          city={city}
          state={state}
          email={email}
          notes={notes}
          phone={phone}
          csrCode={csrCode}
          csrEmail={csrEmail}
          name={cardholderName}
          validateAmount={() => { setAmountFocused(true); }}
          zip={zip}
          subdomain={vendor.subdomain}
          submitPressed={submitPressed}
          setSubmitPressed={setSubmitPressed}
          hidePaymentButton={hasESign}
          onPaymentApproved={hasESign ? handlePaymentApproved : undefined}
          ref={wiretabRef}
          invoiceNumber={invoiceID} />
    })
  } : {};


  useEffect(() => {
    if (policyId && vendor?.subdomain) {
      const fetchPolicy = async () => {
        const result = await fetch(`${BaseUrl()}/pay/${vendor?.subdomain}/get-policy-by-id?policyid=${policyId}`);
        const json = await result.json();
        setPolicy(json);
      }
      fetchPolicy();
    }
  }, [policyId, vendor?.subdomain])


  useEffect(() => {
    if (accountCode.trim() == "" || accountCode == null || amount == 0) {
      setAccountValid(false);
    }
    else {
      setAccountValid(true);
    }
  }, [accountCode, amount]);





  useEffect(() => {
    // Function to fetch data from your API
    const fetchData = async () => {
      setIsLoading(true);
      try {

        if (isPortal) {
          const result = await fetchWithAuth("get-vendor", {})
          setVendor(result);
          setIsLoading(false)
          return
        }
        let clientid =
          (context ?? "app") === "app"
            ? BaseUrl().split('.')[0].split('//')[1]
            : (context ?? "ins-dev");

        if (clientid == "127") clientid = "ins-dev"

        const response = await fetch(`${BaseUrl()}/pay/${clientid.replace("test", "ins-dev")}/get-vendor`);

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result = await response.json();
        setVendor(result);
      } catch (err) {
        setError(err.message); // Set error if something goes wrong
      }
      setIsLoading(false);
    };

    fetchData();

  }, [])

  useEffect(() => {

    const fetchData = async () => {
      if (invoiceID && vendor?.subdomain) {

        const invoiceIdList = invoiceID.split(',');

        const hasNaN = invoiceIdList.some(item => Number.isNaN(Number(item)));

        if (!hasNaN) {
          try {
            setIsInvLoading(true);
            let result = null;
            if (isPortal) {
              result = await fetchWithAuth("get-invoice", { LookupCode: accountCode, InvoiceNumber: invoiceIdList, AccountId: isNaN(Number(epicClientNumber)) ? null : epicClientNumber });
            }
            else {

              const response = await fetch(`${BaseUrl()}/pay/${vendor.subdomain}/get-invoice`, {
                method: 'POST',
                body: JSON.stringify({ LookupCode: accountCode, InvoiceNumber: invoiceIdList, AccountId: isNaN(Number(epicClientNumber)) ? null : epicClientNumber }),
                headers: { 'Content-Type': 'application/json' }
              });

              if (!response.ok) {
                throw new Error('Failed to fetch data');
              }

              result = await response.json();
            }
            setInvoice(result);
            if (result && result.length > 0) {
              result.forEach((r) => r['AmountDisplay'] = FormatCurrency(r.Balance));
              const totalBalance = result.reduce((sum, item) => sum + item.Balance, 0);

              setAmount(totalBalance);
              setAmntDisplayValue(FormatCurrency(totalBalance));
            }

            setIsInvLoading(false);
          } catch (err) {
            setError(err.message); // Set error if something goes wrong
          }
        }
      }

    };

    fetchData();

  }, [accountCode, invoiceID, vendor?.subdomain])

  useEffect(() => {
    // Function to fetch data from your API
    const fetchData = async () => {

      try {
        let result = null;
        if (isPortal) {
          result = await fetchWithAuth("get-surcharge", { ClientLookupCode: accountCode, InvoiceNumber: isNaN(invoiceID) || invoiceID == "" ? -1 : invoiceID });
        }
        else {

          const response = await fetch(`${BaseUrl()}/pay/${vendor.subdomain}/get-surcharge`, {
            method: 'POST',
            body: JSON.stringify({ ClientLookupCode: accountCode, InvoiceNumber: isNaN(invoiceID) || invoiceID == "" ? -1 : invoiceID }),
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch data');
          }

          result = await response.json();
        }
        setSurcharge(result);
      } catch (err) {
        setError(err.message); // Set error if something goes wrong
      }

    };
    if (vendor?.subdomain) fetchData();
  }, [accountCode, invoiceID, vendor?.subdomain])
  // let style = {
  //     border: '1px solid black',
  //     fontsize: '14px',
  //     padding: '3px',
  //     width: '25px'
  // };
  // setIfieldStyle('card-number', style);
  // setIfieldStyle('cvv', style);

  useEffect(() => {
    const GetRefNum = async () => {


      const response = await fetch(`${BaseUrl()}/pay/${vendor.subdomain}/get-ref-num`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const refNumObj = await response.json();
      setRefNum(refNumObj.refNum)
    }
    if (vendor?.subdomain) GetRefNum();
  }
    , [vendor?.subdomain]
  )

  useEffect(
    () => {
      if (vendor && invoice) {
        if (invoice.length == 1)
          setAmountIsEditable(invoice[0].IsEditable);
        else
          setAmountIsEditable(false);
      }
      else if (!amountIsEditable && vendor) {
        setAmountIsEditable(vendor.isAmountEditable)
      }
    }
    , [vendor, invoice]
  )




  const verify3DS = (verifyData) => {
    window.ck3DS.verifyTrans(verifyData);
  }

  const handle3DSResults = async (actionCode, xCavv, xEciFlag, xRefNum, xAuthenticateStatus, xSignatureVerification, error) => {
    try {
      console.log('handle3DSResults')
      const postData = {
        xSoftwareName: "Test-React-iFields",
        xSoftwareVersion: "1.0",
        xVersion: "5.0.0",
        x3dsError: error,
        xRefNum: xRefNum,
        xCavv: xCavv,
        xEci: xEciFlag,
        x3dsAuthenticationStatus: xAuthenticateStatus,
        x3dsSignatureVerificationStatus: xSignatureVerification,
        x3dsActionCode: actionCode,
      };
      const response = await fetch('/api/verifyjson', { method: 'POST', body: JSON.stringify(postData), headers: { 'Content-Type': 'application/json' } });
      setGateway3dsResponse(await response.json());
    } catch (error) {
      console.error(error);
      setGateway3dsResponse(error);
    }
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(raw);
    setAmntDisplayValue(raw);
  };

  const handleAmountBlur = () => {
    setAmntDisplayValue(FormatCurrency(amount)); // Format on blur
  };

  const handleFocus = () => {
    setAmntDisplayValue(amount); // Show raw when user focuses again
  };

  const handleInvoiceFocus = (index) => {
    const updated = [...invoice];
    updated[index].AmountDisplay = updated[index].Balance;
    setInvoice(updated);
  }

  const handlInvoiceAmountBlur = (index) => {
    const updated = [...invoice];
    updated[index].AmountDisplay = FormatCurrency(updated[index].Balance);
    setInvoice(updated);
  }







  useEffect(() => {

    if (amount == 0) {
      amountRef.current?.focus();
    }
    else if (accountCode == "") {
      accountRef.current?.focus
    }
    else {
      focusIfield('card-number');
    }
  }, []);

  return (<>
    {showModal && <ConfirmationModal onClose={() => setShowModal(false)} showButton={false} >
      <div style={{ margin: '5px' }}>{message}</div>
    </ConfirmationModal>} <div style={{
      margin: "auto",
      maxWidth : "1000px"
    }}>   <div>

        {
          !isPortal &&
          <div className='logo-header'>
            <div className='logo-container'>

              <img style={{ maxHeight: "100%" }} src={isTabletOrMobile ? vendor.MobileLogoUrl : vendor.LogoUrl}></img>


            </div>
          </div>
        }
        <div className='main' >


          {hasESign && !policy.IsSignedAndPaid && (
      <>
        {/* Signature banner */}
        <div style={{ padding: "16px 24px", background: "#fff", borderTop: "1px solid #e5e7eb" }}>
          {eSignData ? (
            <p style={{ color: "#16a34a", fontWeight: 600, margin: 0 }}>✓ Policy signed — ready to submit payment</p>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent:"center", 
                width:"100%",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 6,
                border: `2px solid ${submitPressed ? "#dc2626" : "#f59e0b"}`,
                background: submitPressed ? "#fef2f2" : "#fffbeb",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <span style={{ color: submitPressed ? "#dc2626" : "#b45309", fontSize: 13, fontWeight: 600 }}>
                Signature is required before paying.
              </span>
              <button
                onClick={() => setShowSigner(true)}
                style={{ background: "none", border: "none", padding: 0, color: "#148dc2", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
              >
                Click here to sign
              </button>
            </div>
          )}
        </div>

       
      </>
    )}

        {/* {isSigned && <div style={{backgroundColor: "white", padding: "4px"}}> ✅Policy signed successfully. Please proceed to payment.
            <a onClick={() => DownloadPolicyDocument(policy.DocumentId, policy.PolicyId, vendor.subdomain)} style={{paddingLeft:"20px", cursor:"pointer", textDecoration: "underline", color: "#148dc2", fontWeight: "600"}}> Download Signed Policy</a>
          </div>} */}
        {error != "" && <div style={{ backgroundColor: "#b82630", color: 'white', paddingLeft: "10px" }}>
          <p >{error}</p>
        </div>
        }
        <div className='payment-container'>

          <div className='payment-left-panel'>
            <div className='payment-card'>
              <div >
                <h3>

                  Policy Details
                </h3>
              </div>
              <div >

                <div className="form-group">
                  <label htmlFor="cardholder-name" className="form-label">Account ID:</label>




                  <>
                    <input
                      className={`form-input ${accountFocused && accountCode == "" ? "invalid" : ""}`}
                      ref={accountRef}
                      type="text"
                      value={accountCode}
                      disabled={!accountIDIsEditable}
                      placeholder="Account ID"
                      onFocus={() => { setFocusedField("Account") }}
                      onBlur={() => { setFocusedField("") }}
                      onChange={(e) => setAccountCode(e.target.value)}
                    />
                    {
                      accountFocused && accountCode == "" ?
                        <div className="toast show" id="toast-for-accountid">Account ID required.</div>
                        : ''
                    }
                  </>


                </div>

                {
                  (!invoice || invoice.length <= 1) ?
                    <div className="form-group">
                      <label htmlFor="invoice-id" className="form-label">Invoice Number:</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Invoice ID"
                        value={invoiceID}
                        disabled={!invoiceIdIsEditable}

                        onChange={(e) => setInvoiceID(e.target.value)}
                      />
                    </div>
                    :
                    <table className="invoice-table">
                      <thead>
                        <tr>
                          <th></th>
                          <th>Invoice Number</th>
                          <th>Balance</th>
                        </tr>
                      </thead>
                      <tbody>

                        {invoice.map((inv, index) => {
                          if (inv.Selected == undefined) inv['Selected'] = true;
                          return <tr key={inv.AppliedEpicInvoiceNumber || index}>
                            {/* Select checkbox */}
                            <td>
                              <input
                                type="checkbox"
                                checked={inv.Selected}
                                onChange={() => handleSelectChange(index)}
                              />
                            </td>

                            {/* Invoice Number */}
                            <td>{inv.AppliedEpicInvoiceNumber}</td>

                            {/* Balance */}
                            <td>
                              {inv.IsEditable ? (
                                <input
                                  onChange={(e) => { handleInvoiceAmountChange(index, e.target.value) }}
                                  value={inv.AmountDisplay}
                                  onFocus={() => { handleInvoiceFocus(index) }}
                                  onBlur={() => { handlInvoiceAmountBlur(index) }}
                                />
                              ) : (
                                FormatCurrency(inv.Balance)
                              )}
                            </td>
                          </tr>
                        })}
                      </tbody>
                    </table>
                }

                <div className="form-group">
                  <label htmlFor="invoice-id" className="form-label">Amount:</label>


                  <input
                    ref={amountRef}
                    className="form-input"
                    type="text"
                    placeholder="$0.00"
                    value={invoice && invoice.length > 1 ? FormatCurrency(invoice.reduce((sum, item) => sum + (item.Selected ? item.Balance : 0), 0)) : amntDisplayValue}
                    onChange={handleAmountChange}
                    onBlur={handleAmountBlur}
                    onFocus={handleFocus}
                    disabled={!amountIsEditable}
                  />
                  {
                    amountFocused && amount <= 0 ?
                      <div className="toast show" id="toast-for-accountid">Amount required.</div>
                      : ''
                  }
                </div>
                <div className="form-group">
                  <label htmlFor="notes">Notes (Optional)</label>
                  <textarea className='form-input' id="notes" name="notes" rows="3"></textarea>
                </div>

              </div>

            </div>

            <div className='card'>
              <div className="card-header">
                <h3>
                  Billing Information
                </h3>
              </div>
              <div className='card-body'>

                <div className="form-group">
                  <label htmlFor="cardholder-name" className="form-label">Cardholder Name</label>
                  <input
                    type="text"
                    id="cardholder-name"
                    name="cardholder-name"
                    placeholder='Cardholder'
                    className="form-input"
                    onChange={(e) => setCardHolderName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address" className="form-label">Billing Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    placeholder='Address'
                    className="form-input" onChange={(e) => setBillingAddress(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group form-col">
                    <label htmlFor="city" className="form-label">City</label>
                    <input
                      type="text"
                      id="city" name="city"
                      className="form-input city-select"
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="form-group form-col">
                    <label htmlFor="state" className="form-label">
                      State
                    </label>
                    <Select
                      inputId="state"
                      options={states}
                      value={state}
                      onChange={(selectedOption) => setState(selectedOption?.value)}
                      isClearable={false}
                      placeholder=""
                      styles={customStyles}
                      components={{
                        IndicatorSeparator: () => null  // This removes the vertical line separator
                      }}
                      classNamePrefix="Select"
                    />
                  </div>
                  <div className="form-group form-col">
                    <label htmlFor="zip" className="form-label">ZIP Code</label>
                    <input type="text" id="zip" name="zip" onChange={(e) => setZip(e.target.value)} className="form-input  zip-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone </label>
                  <input
                    className='form-input'
                    type="tel" id="phone"
                    name="phone"
                    placeholder="(XXX) XXX-XXXX"
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    className='form-input'
                    type="email"
                    id="email"
                    name="email"
                    required=""
                    placeholder="user@email.com"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

            </div>


          </div>
          <div className='payment-right-panel'>
            <div className='card'>
              <div>
                <h3>
                  Payment Info
                  <FontAwesomeIcon icon={faLock} style={{
                    color: '#444',
                    fontSize: '1rem',
                    padding: '4px',
                    verticalAlign: 'middle'
                  }} />
                </h3>
              </div>
              <div>
                <PaymentTabs setActiveTab={setActiveTab} tabs={paymentTabData} activeTab={activeTab} />
              </div>
            </div>


          </div>


        </div>


      </div>
      {(isLoading || isInvLoading) && <Loader />}
    </div>

    {hasESign && !policy.IsSignedAndPaid && (
      <>
        {/* Signature banner */}


        {/* Full-width submit button */}
        <div style={{ padding: "0 24px 24px" }}>
          <button
            onClick={() => {
              if (!eSignData) {
                setSubmitPressed(true);
                return;
              }
              handleSignAndPay();
            }}
            style={{
              width: "100%",
              padding: "14px",
              background: eSignData ? "#148dc2" : "#b0c4d4",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.2s",
              boxShadow: eSignData ? "0 2px 8px rgba(20,141,194,0.3)" : "none",
            }}
          >
            Submit Signature and Pay
          </button>
        </div>

        {/* PolicySigner modal */}
        {showSigner && (
          <PolicySigner
            pdfUrl={policy.PdfUrl}
            policy={policy}
            signerName={cardholderName}
            signerEmail={email}
            onReady={(data) => { setESignData(data); }}
            onClose={() => setShowSigner(false)}
            submitPressed={submitPressed}
          />
        )}
      </>
    )}
  </div >
     </>);
}