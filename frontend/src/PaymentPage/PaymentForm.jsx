import React, { use, useRef, useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { FormatCurrency, BaseUrl, fetchWithAuth } from '../Utilities';
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
import InvoiceSummary from './InvoiceSummary.jsx';
import ThankYouPage from './ThankYouPage.jsx';


export default function PaymentForm({ isPortal, onSuccess }) {



  const { context } = useParams();
  // const [status, setStatus] = useState("loading");

  // useEffect(() => {
  //   fetch(`g.instechpay.co/pay/${param}/validate`)
  //     .then(res => {
  //       if (res.status === 404) throw new Error("not-found");
  //       if (!res.ok) throw new Error("error");
  //       return res.json();
  //     })
  //     .then(() => setStatus("ok"))
  //     .catch(err => {
  //       if (err.message === "not-found") {
  //         setStatus("not-found");
  //       } else {
  //         setStatus("error");
  //       }
  //     });
  // }, [param]);

  // if (status === "loading") return <div>Loading…</div>;
  // if (status === "not-found") return <div> 404 Page not found</div>  ;
  // if (status === "error") return <div>Something went wrong</div>;


  const [searchParams] = useSearchParams();
  const accountID = searchParams.get("account") ?? "";
  const invoiceAmount = searchParams.get("amount")?.replace(",","")?.replace("$", "") ?? null;
  const epicClientNumber = searchParams.get("accountid") ?? 0;
  const invoiceIDparam = searchParams.get("invoiceid") ?? "";
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



  const [focusedField, setFocusedField] = useState('')
  const [accountFocused, setAccountFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInvLoading, setIsInvLoading] = useState(false);
  const [amntDisplayValue, setAmntDisplayValue] = useState(FormatCurrency(amount));
  const [state, setState] = useState('');
  const [activeTab, setActiveTab] = useState("Credit Card");
  const [visibleSurcharge , setVisibleSurcharge] = useState(0);

  const [refNum, setRefNum] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [message , setMessage] = useState("");
  const [step, setStep] = useState(invoiceIDparam ? "invoices" : "payment");


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

  
  const onError =(message) => {
    setMessage(message);
    setShowModal(true);
  }

const handleSuccess = () => {
    setStep("complete");
    if (onSuccess) onSuccess();
  };

  const [accountValid, setAccountValid] = useState(true);


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
        onFinish={handleSuccess}
        onError={onError}
        vendor={vendor}

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
        onFinish={handleSuccess}
        onError={onError}
        ifieldsKey={vendor.CardknoxIFeildsKey}
        vendor={vendor}
      />,
    ...(vendor.BankInfo && !isPortal &&  {
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
          invoiceNumber={invoiceID} />
    })
  } : {};




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
        const clientid =
          (context ?? "app") === "app"
            ? BaseUrl().split('.')[0].split('//')[1].replace("127", "ins-dev")
            : (context ?? "ins-dev");

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
      if (!vendor.subdomain) return;
      if (invoiceID) {

        const invoiceIdList = invoiceID.split(',');

        const hasNaN = invoiceIdList.some(item => Number.isNaN(Number(item)));

        if (!hasNaN) {
          try {
           // setIsInvLoading(true);
            let result = null;
            if (isPortal) {
              result = await fetchWithAuth("get-invoice",
                { LookupCode: accountCode, InvoiceNumber: invoiceIdList, AccountId: isNaN(Number(epicClientNumber)) ? null : epicClientNumber }
              );
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

         
          } catch (err) {
            //setError(err.message); // Set error if something goes wrong
          }
          finally
          {
               setIsInvLoading(false);
          }
        }
      }

    };

    fetchData();

  }, [accountCode, invoiceID, vendor.subdomain])

  useEffect(() => {
    // Function to fetch data from your API
     if (!vendor.subdomain) return;
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
        setVisibleSurcharge(result.surcharge * 100 )
      } catch (err) {
        setError(err.message); // Set error if something goes wrong
      }

    };
    fetchData();
  }, [accountCode, invoiceID, vendor.subdomain])
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
      if (!vendor.subdomain) return;
      const response = await fetch(`${BaseUrl()}/pay/${vendor.subdomain}/get-ref-num`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const refNumObj = await response.json();
      setRefNum(refNumObj.refNum)
    }
    GetRefNum();
  }
    , [vendor.subdomain]
  )

  useEffect (
    ()=> 
    {
      setSurcharge(
        {...surcharge, surcharge: visibleSurcharge/100}
      )
    },
    [visibleSurcharge]
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


  const amountRef = useRef(null);
  const accountRef = useRef(null);


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

  const selectedTotal = invoice
    ? invoice.reduce((sum, item) => sum + (item.Selected !== false ? item.Balance : 0), 0)
    : (amount ?? 0);

  const logoHeader = !isPortal && (
    <div className='logo-header'>
      <div className='logo-container'>
        <img style={{ maxHeight: "100%" }} src={isTabletOrMobile ? vendor.MobileLogoUrl : vendor.LogoUrl} />
      </div>
    </div>
  );

  
  if (step === "complete") {
    return <ThankYouPage />;
  }

  if (step === "invoices") {
    return (
      <>
        {!isPortal && (
          <div className='logo-header'>
            <div className='logo-container'>
              <img style={{ maxHeight: "100%" }} src={isTabletOrMobile ? vendor.MobileLogoUrl : vendor.LogoUrl} />
            </div>
          </div>
        )}
        <InvoiceSummary invoices={invoice ?? []} onProceed={() => setStep("payment")} accountCode={accountCode} />
      </>
    );
  }

  const STEPS = invoiceIDparam ? ['Summary', 'Payment', 'Complete'] : ['Payment', 'Complete'];
  const ACTIVE_STEP = invoiceIDparam ? 1 : 0;

  const wizardStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '36px',
  };
  const stepCircleBase = {
    width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0,
  };
  const connectorStyle = { flex: 1, height: '2px', backgroundColor: '#e2e8f0', maxWidth: '60px' };

  return (
    <>
      {showModal && (
        <ConfirmationModal onClose={() => setShowModal(false)} showButton={false}>
          <div style={{ margin: '5px' }}>{message}</div>
        </ConfirmationModal>
      )}

      {!isPortal && (
        <div className='logo-header'>
          <div className='logo-container'>
            <img style={{ maxHeight: '100%' }} src={isTabletOrMobile ? vendor.MobileLogoUrl : vendor.LogoUrl} />
          </div>
        </div>
      )}

      <div style={{
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        backgroundColor: '#f0f4f8', minHeight: '100vh', display: 'flex',
        flexDirection: 'column', alignItems: 'center', padding: '48px 20px', color: '#1e293b',
      }}>

        {/* Wizard progress */}
        <div style={{ width: '100%', maxWidth: '560px', marginBottom: '8px' }}>
          <div style={wizardStyle}>
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div style={connectorStyle} />}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    ...stepCircleBase,
                    backgroundColor: i === ACTIVE_STEP ? '#0070ba' : i < ACTIVE_STEP ? '#0070ba' : '#e2e8f0',
                    color: i <= ACTIVE_STEP ? '#fff' : '#94a3b8',
                    opacity: i < ACTIVE_STEP ? 0.5 : 1,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: i === ACTIVE_STEP ? '700' : '400',
                    color: i === ACTIVE_STEP ? '#0070ba' : '#94a3b8',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          width: '100%', maxWidth: '560px', padding: '40px 36px',
        }}>
          {error && <p style={{ color: '#dc2626', marginTop: 0 }}>{error}</p>}

          {/* Account header — only when pre-filled from URL */}
          {!accountIDIsEditable && accountCode && (
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '3px' }}>
                Account
              </span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                {accountCode}
              </span>
            </div>
          )}

          {/* Amount — editable input when not in URL */}
          {invoiceAmount === null && (
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                Amount
              </span>
              <input
                ref={amountRef}
                className={`form-input ${amountFocused && !amount ? 'invalid' : ''}`}
                type="text"
                value={amntDisplayValue}
                placeholder="$0.00"
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                onFocus={handleFocus}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              {amountFocused && !amount && (
                <div className="toast show">Amount required.</div>
              )}
            </div>
          )}

          {/* Total — top of card */}
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
            Total
          </span>
          {(() => {
            const base = invoice && invoice.length > 1
              ? invoice.reduce((sum, item) => sum + (item.Selected !== false ? item.Balance : 0), 0)
              : parseFloat(amount ?? 0) || 0;
            const surchargeAmt = activeTab === 'Credit Card'
              ? (invoice && invoice.length > 1
                  ? invoice.reduce((sum, item) => sum + (item.Selected !== false ? item.Balance * (item.Surcharge || 0) : 0), 0)
                  : base * (surcharge.surcharge || 0))
              : 0;
            const grandTotal = base + surchargeAmt;
            return (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
                {surchargeAmt > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                      <span>Subtotal</span>
                      <span>{FormatCurrency(base)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                      <span>Electronic Transfer Fee</span>
                      <span>{FormatCurrency(surchargeAmt)}</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                    {surchargeAmt > 0 ? 'Grand Total' : 'Amount Due'}
                  </span>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>
                    {FormatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Account ID — editable input only when not pre-filled from URL */}
          {accountIDIsEditable && (
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                Account ID
              </span>
              <input
                ref={accountRef}
                className={`form-input ${accountFocused && accountCode === '' ? 'invalid' : ''}`}
                type="text"
                value={accountCode}
                placeholder="Enter Account ID"
                onChange={(e) => setAccountCode(e.target.value)}
                onFocus={() => setAccountFocused(true)}
                onBlur={() => setAccountFocused(false)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              {accountFocused && accountCode === '' && (
                <div className="toast show">Account ID required.</div>
              )}
            </div>
          )}

          {/* Payment options */}
          <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '24px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
              Payment Method
              <FontAwesomeIcon icon={faLock} style={{ color: '#94a3b8', fontSize: '11px' }} />
            </span>
            <PaymentTabs setActiveTab={setActiveTab} tabs={paymentTabData} activeTab={activeTab} />
          </div>
        </div>
      </div>

      {(isLoading || isInvLoading) && <Loader />}
    </>
  );
}