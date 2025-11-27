import { useEffect, useState } from "react"
import { fetchWithAuth } from "../Utilities"
import { ConfirmationModal } from "./ConfimationModal"
import PaymentTabs from "../PaymentPage/PaymentTabs"
import { CreditCardInfo } from "./CreditcardInfo"
import { CheckingInfo } from "./CheckingInfo"
import { useSuccessModal } from "./SuccessModal"
import { Trash2 } from "lucide-react"

export const PaymentMethods =({CustomerId, defaultMethodId})=> {

    const [paymentMethods , setPaymentMethods ] = useState([])
    const [submitPressed , setSubmitPressed]= useState (false)

     const [accountType , setAccountType ] = useState("Checking");
    const [accountName , setAccountName ] = useState("");
    const [accountNumber , setAccountNumber ] = useState("");
    const [routingNumber , setRoutingNumber ] = useState("");



    const [ activeTab, setActiveTab ]=useState("Credit Card");
    const [cardToken ,setCardToken] = useState ("");
    const [cvvToken , setCvvToken ] = useState("")
    const [ccValid , setCcValid ]= useState(true); 
    const [cvvValid , setCvvValid ]= useState(true); 
    const [expMonth, setExpMonth] = useState('');
    const [expYear, setExpYear] = useState('');
    
    const [showNewPaymentMethod , setShowNewPaymentMethod]= useState(false);
    const [showUpdateDefaultConfirm , setShowUpdateDefaultConfirm] = useState (false);
    const [showDeleteConfirm , setShowDeleteConfirm] = useState (false);
    const [defaultMethod, setDefaultMethod ]= useState(defaultMethodId)
    const [selectedMethod , setSelectedMethod] = useState({});
    
    const {showSuccess, SuccessModal}= useSuccessModal();


    useEffect(()=>{
        const getData = async()=>{
        const request = {
            Filters: {
                CustomerId: CustomerId
            }
        }
        const response =  await fetchWithAuth("list-payment-methods", request) 
        setPaymentMethods(response.PaymentMethods);
    }
    getData(); 
    },[])


    const getCardIcon = (type) => {
        const cardType = (type || "").toLowerCase();


            switch (cardType) {
            case "visa":
                return (
                <svg width="40" height="24" viewBox="0 0 40 24">
                    <rect width="40" height="24" rx="4" fill="#1a1f71" />
                    <text x="2" y="16" fill="white" fontFamily="Arial" fontWeight="bold">
                    VISA
                    </text>
                </svg>
                );
            case "mastercard":
                return (
                <svg width="40" height="24" viewBox="0 0 40 24">
                    <rect width="40" height="24" rx="4" fill="white" stroke="#ccc" />
                    <circle cx="16" cy="12" r="6" fill="#EB001B" />
                    <circle cx="24" cy="12" r="6" fill="#F79E1B" />
                </svg>
                );
            case "discover":
                return (
                <svg width="40" height="24" viewBox="0 0 40 24">
                    <rect width="40" height="24" rx="4" fill="white" stroke="#ccc" />
                    <text x="5" y="15" fill="#ff6000" fontFamily="Arial" fontWeight="bold" fontSize="10">
                    DISCOVER
                    </text>
                </svg>
                );
            case "amex":
            case "american express":
                return (
                <svg width="40" height="24" viewBox="0 0 40 24">
                    <rect width="40" height="24" rx="4" fill="#2e77bc" />
                    <text x="3" y="16" fill="white" fontFamily="Arial" fontWeight="bold" fontSize="9">
                    AMEX
                    </text>
                </svg>
                );
            default:
                return <span style={{ fontSize: "1.5em" }}>💳</span>;
            }
        }
    
    
    const AddPaymentMethod = async()=>{
        setSubmitPressed(true)
        let rsp; 
         const CcInfo = {
            xCardNum: cardToken, 
            xCvv: cvvToken, 
            xExp: `${expMonth.value}${expYear.value}`,
            Exp:  `${expMonth.value}${expYear.value}`,
            CustomerId
        }
        const CheckInfo = {
            xAccount : accountNumber,
            xRouting : routingNumber, 
            xName : accountName,
            Routing: routingNumber,
            CustomerId
        }

        if(activeTab ==  "Credit Card")
        {
            rsp = await fetchWithAuth("create-payment-method-cc", CcInfo)
        }
        else 
        {
            rsp = await fetchWithAuth("create-payment-method-check", CheckInfo)
        }
        
        if (rsp.Error != "") {
            // Show error message if backend provided 
            const message = data.message || `Request failed: ${response.Error}`;
            //showError(message);
            console.error("Error:", message);
            return;
        }
        setShowNewPaymentMethod(false);
        showSuccess("New payment method created!");
    }

    const DeletePaymentMehtod = async()=>{
        const req = {
            PaymentMethodId: selectedMethod.PaymentMethodId
        }
        var rsp = await fetchWithAuth ("delete-payment-method", req);
        if (rsp.Error == "")
        {
            showSuccess("Successfully deleted payment method")
            setShowDeleteConfirm(false);
        }


    }

    const ChangeDefaultMethod = async()=> 
    {
        
        const {
            Token, 
            TokenType, 
            CustomerId,
           ...req
        } = selectedMethod

        const reqWithDefault = 
        {...req, 
            SetAsDefault : true
        }
        const rsp = await fetchWithAuth("update-payment-method", reqWithDefault)
        if (rsp.Error == "")
        {
            showSuccess("Successfully updated default method")
            setShowUpdateDefaultConfirm(false);
            setDefaultMethod(selectedMethod.PaymentMethodId)
        }

    }

    const ShowDeleteConfirm =( paymentMethod)=> 
    {
        setShowDeleteConfirm(true);
        setSelectedMethod(paymentMethod);
    }
    
    
  const tabs =   {
        "Credit Card":
              <CreditCardInfo 
                setCvvToken={setCvvToken} 
                setCardToken={setCardToken} 
                ccValid={ccValid} 
                setCcValid={setCcValid} 
                cvvValid={cvvValid} 
                setCvvValid={setCvvValid}
                expMonth={expMonth}
                setExpMonth={setExpMonth}
                expYear={expYear}
                setExpYear={setExpYear}  
                submitPressed={submitPressed}         
                />
          ,
        "eCheck":
          <CheckingInfo
            accountName={accountName}
            setAccountName={setAccountName}
            accountNumber={accountNumber}
            setAccountNumber={setAccountNumber}
            accountType={accountType}
            setAccountType={setAccountType}
            routingNumber={routingNumber}
            setRoutingNumber={setRoutingNumber}
            submitPressed={submitPressed}
          />
      }

    return <div className="payment-methods">
      {paymentMethods.map((method) => (
        <div className="payment-method-div" key={method.PaymentMethodId}>
          <div className="icon">
            {method.TokenType === "CC"
              ? getCardIcon(method.CardType)
              : <span style={{ fontSize: "1.5em" }}>🏦</span>}
          </div>

          <div className="details">
            <div className="masked-number">{method.MaskedNumber}</div>
            {method.Exp && (
              <div className="exp-date">Exp: {method.Exp.slice(0, 2)}/{method.Exp.slice(2)}</div>
            )}
          </div>

          <div className="default-toggle">
            <label>
                Default
              <input
                type="radio"
                name= "default-method"
                checked={defaultMethod === method.PaymentMethodId}
                onChange={() => {setSelectedMethod(method); setShowUpdateDefaultConfirm(true);}}
              />
              
            </label>
          </div>

          <a className="delete-btn" onClick={() =>ShowDeleteConfirm(method)}>
            <Trash2/>
          </a>
        </div>
      ))}

      <div style={{display:"flex", justifyContent:"center"}}>
        <button className="btn btn-primary" type="button" onClick={()=>setShowNewPaymentMethod(true)}> New Payment Method</button>
      </div>

      {showNewPaymentMethod && <ConfirmationModal confirmButtonText={"Save"}  onConfirm={AddPaymentMethod} onClose={()=>setShowNewPaymentMethod(false)}>
         <section>
            <h3> Payment Info</h3>
        <PaymentTabs 
            tabs={tabs} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
        />
        </section>
      </ConfirmationModal>}

      {showDeleteConfirm && <ConfirmationModal confirmButtonText={ "Delete"} onClose={()=> setShowDeleteConfirm(false)} onConfirm={DeletePaymentMehtod}>
         <h2>Are you sure you want to delete this method?</h2>
        <span></span>
        <div>
            <div className="trd-info-row">
                <span className="amount ">{selectedMethod.PaymentMethodId}</span>
            </div>
        </div>

        </ConfirmationModal>}

        {showUpdateDefaultConfirm && <ConfirmationModal confirmButtonText={ "Set Default"} onClose={()=> setShowUpdateDefaultConfirm(false)} onConfirm={ChangeDefaultMethod}>
         <h2>Set payment method to default?</h2>
        <span></span>
        <div>
            <div className="trd-info-row">
                <span className="amount ">{selectedMethod.PaymentMethodId}</span>
            </div>
        </div>

        </ConfirmationModal>}
      <SuccessModal/>
    </div>
  

}
