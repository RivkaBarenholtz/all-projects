import { useRef, useState , useEffect} from "react"
import CardnoxField from "../PaymentPage/CardnoxField"
import { CARD_TYPE, CVV_TYPE } from "@cardknox/react-ifields"
import { fetchWithAuth } from "../Utilities"
import Select from "react-select";

export const   CreditCardInfo =(
    {   
        setCvvToken, 
        setCardToken , 
        ccValid , 
        setCcValid, 
        cvvValid , 
        setCvvValid, 
        expMonth, 
        setExpMonth, 
        expYear, 
        setExpYear, 
        submitPressed
    })=>{
    const [vendor, setVendor] = useState({});
    const [issuer, setIssuer] = useState('');
        
    const cardRef = useRef(); 
    const cvvRef = useRef(); 
    

    useEffect(() => {
    // Function to fetch data from your API
    const fetchData = async () => {
      
      try {
        const response = await fetchWithAuth("get-vendor",{})

        setVendor(response);
      } catch (err) {
        // setError(err.message); // Set error if something goes wrong
      }
     
    };
    
     fetchData();
    
  }, [])


     const onCardToken = (data) => {
        setCardToken(data.xToken);
    };

    const onCvvToken = (data) => {

        setCvvToken(data.xToken);
    };
    addIfieldKeyPressCallback(function (data) {

        if (data.lastIfieldChanged === 'card-number' && data.cardNumberIsValid !== undefined) {
            setCcValid(data.cardNumberIsValid);
            if (!data.cardNumberIsValid)
                setCardToken('');
        }
        if (data.lastIfieldChanged === 'cvv' && data.cvvIsValid !== undefined) {
            setCvvValid(data.cvvIsValid);
            if (!data.cardNumberIsValid)
                setCvvToken('');
        }
    });

    const verify3DS = (verifyData) => {
        window.ck3DS.verifyTrans(verifyData);
    }
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
    return <>
    
    {vendor.CardknoxIFeildsKey && 
    <>
      <div className="form-group">
                <label className="form-label">Card Number:</label>
                <CardnoxField
                    ifieldType={CARD_TYPE}
                    onToken={onCardToken}
                    onIssuer={setIssuer}
                    handle3DSResults={verify3DS}
                    onFocusedChanged = {()=>{}}
                    ref={cardRef}
                    className={` ${!ccValid? 'invalid' : ''} ifields`}
                    ifieldsKey={vendor.CardknoxIFeildsKey}

                />
                {!ccValid  && <div className="toast show" id="toast-for-cardnumber">Valid card number required.</div> }

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
                        styles={customStyles}
                        components={{
                            IndicatorSeparator: () => null  // This removes the vertical line separator
                        }}
                        className={`${expMonth == '' ? "invalid" : ""} select-input`}
                    />
                    {expMonth == '' && submitPressed ? <div className="toast show" id="toast-for-expMonth">Exp month required.</div> : ''}

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
                            ...customStyles,
                            control: (provided, state) => ({
                                ...customStyles.control(provided, state),
                                minWidth: '100px'  // override minWidth
                            }
                            ),
                            menu: (provided, state) => ({
                                ...customStyles.menu(provided, state),
                                minWidth: '8ch'  // override minWidth
                            }
                            )
                        }}
                        className={`${expYear == ''? "invalid" : ""} select-input`}

                        classNamePrefix="Select"
                        components={{
                            IndicatorSeparator: () => null  // This removes the vertical line separator
                        }}
                    />
                    {expYear == '' && submitPressed? <div className="toast show" id="toast-for-expYear">Exp year required.</div> : ''}

                </div>
                <div className="form-group form-col">
                    <label className="form-label">CVV:</label>
                    <CardnoxField
                        ifieldType={CVV_TYPE}
                        issuer={issuer}
                        onToken={onCvvToken}
                        ref={cvvRef}
                        className={`${!cvvValid? 'invalid' : ''}  ifields`}
                        ifieldsKey={vendor.CardknoxIFeildsKey}
                        onFocusedChanged = {()=>{}}
                    />

                    {!cvvValid&& <div className="toast show" id="toast-for-cvv">Valid CVV required.</div> }
                </div>


            </div>
            </>
    }
</>
}