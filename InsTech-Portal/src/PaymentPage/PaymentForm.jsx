import React, { use, useRef, useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { FormatCurrency, BaseUrl } from '../Utilities';
import { useSearchParams , useParams} from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import Select from "react-select";
import PaymentTabs from './PaymentTabs';
import { CreditCardTab } from './CreditCardTab';
import { WireTab } from './WireTab.jsx';
import { CheckTab } from './CheckTab.jsx';
import Loader from './Loader.jsx';



export default function PaymentForm({isPortal , onSuccess }) {



  const {context } = useParams();
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
  const invoiceAmount = searchParams.get("amount") ?? 0;
  const epicClientNumber = searchParams.get("accountid") ?? 0;
  const invoiceIDparam = searchParams.get("invoiceid") ?? 0;
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
  const [invoiceID, setInvoiceID] = useState(invoiceIDparam??0);
  const [amountIsEditable, setAmountIsEditable] = useState(true);



  const [focusedField, setFocusedField] = useState('')
  const [accountFocused, setAccountFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [isLoading , setIsLoading ] = useState(false);
  const [isInvLoading , setIsInvLoading ] = useState(false);
  const [amntDisplayValue, setAmntDisplayValue] = useState(FormatCurrency(amount));
  const [state, setState] = useState('');
  const [activeTab, setActiveTab] = useState("Credit Card");

  const [refNum , setRefNum ] = useState("");
    


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

  const paymentTabData = vendor.CardknoxIFeildsKey? {
    "Credit Card":
      <CreditCardTab
        amount={invoice && invoice.length > 1? invoice.reduce((sum, item) => sum + (item.Selected || item.Selected == undefined?item.Balance:0), 0):amount}
        surcharge={surcharge.surcharge}
        surchargeAmount={invoice && invoice.length > 1? invoice.reduce((sum, item) => sum + (item.Selected || item.Selected == undefined?item.Balance * item.Surcharge:0), 0):amount* surcharge.surcharge}
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

      />,
    "eCheck":
      <CheckTab
        amount={invoice && invoice.length > 1? invoice.reduce((sum, item) => sum + (item.Selected?item.Balance:0), 0):amount}
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
      />,
    ...(vendor.BankInfo && {"Wire Funds":
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
        validateAmount={ ()=>{setAmountFocused(true);}}
        zip={zip}
        invoiceNumber={invoiceID}/>})
  }:{};




  useEffect(() => {
    if (accountCode.trim() == "" || accountCode == null || amount == 0 ) {
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
        const response = await fetch(`${BaseUrl()}/pay/${context}/get-vendor`);

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
      if(invoiceID)
      {
        
        const invoiceIdList = invoiceID.split(',');

        const hasNaN = invoiceIdList.some(item => Number.isNaN(item));

        if (!hasNaN) {
          try {
            setIsInvLoading(true);
      
            const response = await fetch(`${BaseUrl()}/pay/${context}/get-invoice`, {
              method: 'POST',
              body: JSON.stringify({ LookupCode: accountCode, InvoiceNumber: invoiceIdList, AccountId: isNaN(epicClientNumber)?null:epicClientNumber }),
              headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
              throw new Error('Failed to fetch data');
            }

            const result = await response.json();
            setInvoice(result);
            if (result && result.length > 0 ) {
              result.forEach((r)=> r['AmountDisplay'] = FormatCurrency(r.Balance) );
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
    
  }, [accountCode, invoiceID])

  useEffect(() => {
    // Function to fetch data from your API
    const fetchData = async () => {

      try {
        const response = await fetch(`${BaseUrl()}/pay/${context}/get-surcharge`, {
          method: 'POST',
          body: JSON.stringify({ ClientLookupCode: accountCode, InvoiceNumber: isNaN(invoiceID)|| invoiceID=="" ? -1 : invoiceID }),
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result = await response.json();
        setSurcharge(result);
      } catch (err) {
        setError(err.message); // Set error if something goes wrong
      }

    };
    fetchData();
  }, [accountCode, invoiceID])
  // let style = {
  //     border: '1px solid black',
  //     fontsize: '14px',
  //     padding: '3px',
  //     width: '25px'
  // };
  // setIfieldStyle('card-number', style);
  // setIfieldStyle('cvv', style);

  useEffect (()=> 
    {
        const GetRefNum = async()=>
        {
            const response = await fetch(`${BaseUrl()}/pay/${context}/get-ref-num`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
                });
            const refNumObj = await response.json();
            setRefNum(refNumObj.refNum)
        }
        GetRefNum();
    }
    , []
    )

  useEffect(
    () => {
      if (vendor && invoice  ) {
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

  const handleInvoiceFocus=(index)=>
  {
    const updated = [...invoice];
    updated[index].AmountDisplay = updated[index].Balance;
    setInvoice(updated);
  }

  const handlInvoiceAmountBlur=(index)=>{
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

  return (
    <div>
      <div className='logo-header'>
        <div className='logo-container'>
          {
            !isPortal && 
            <img style={{maxHeight:"100%"}}  src={isTabletOrMobile ? vendor.MobileLogoUrl : vendor.LogoUrl}></img>
          }

        </div>
      </div>
      <div className='main'>
        <div >
          <p className="error-field">{error}</p>
        </div>
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
                            if (inv.Selected== undefined)  inv['Selected'] = true;
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
                                    onChange={(e)=>{handleInvoiceAmountChange(index, e.target.value)}}
                                    value={inv.AmountDisplay }
                                    onFocus={()=>{handleInvoiceFocus(index)}}
                                    onBlur={()=>{handlInvoiceAmountBlur(index)}}
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
                      placeholder="Enter amount"
                      value={invoice && invoice.length > 1? FormatCurrency(invoice.reduce((sum, item) => sum + (item.Selected?item.Balance:0), 0)):amntDisplayValue}
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
                        onChange={setState}
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
     { (isLoading|| isInvLoading) && <Loader/>}
    </div>);
}