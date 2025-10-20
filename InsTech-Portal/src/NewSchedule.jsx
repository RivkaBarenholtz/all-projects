import { useEffect, useState } from "react";
import { ConfirmationModal } from "./Objects/ConfimationModal";
import { CreditCardInfo } from "./Objects/CreditcardInfo";
import { CheckingInfo } from "./Objects/CheckingInfo";
import PaymentTabs from "./PaymentPage/PaymentTabs";
import { CustomerInfo } from "./Objects/CustomerInfo";
import { SchedulingInfo } from "./Objects/SchedulingInfo";
import { fetchWithAuth } from "./Utilities";

export default function NewSchedule ({CloseNewSchedule})
{
    //ScheduleInfo
    const [formData, setFormData] = useState({
    scheduleName: "",
    description: "",
    amount: 0,
    totalAmount: 0,
    electronicFee: "",
    includeFee: true,
    invoice: "",
    frequency: "month",
    frequencyNum: 1 , 
    runSpecificDay: false,
    skipDays: false,
    calendarType: "Gregorian",
    startDate: "",
    endDate:"",
    endOption: "Never",
    numberOfPayments: "",
    sendReceipt: false,
    retryDefaultCard: false,
    createOnFail: false,
    retryEnabled: false,
    retryAttempts: 5,
    retryDays: 1,
    afterFail: "ContinueNextInterval",
    custom1: "",
    custom2: "",
    transferFee :3.5,
    isCheck:false 
  });
    const handleScheduleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
        });
    };
    //checking info 
    const [accountType , setAccountType ] = useState("Checking");
    const [accountName , setAccountName ] = useState("");
    const [accountNumber , setAccountNumber ] = useState("");
    const [routingNumber , setRoutingNumber ] = useState("");

    


    //cust info
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [company, setCompany] = useState("");
    const [note, setNote] = useState("");
    const [customerNumber, setCustomerNumber] = useState("");
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zip, setZip] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    //payment info
    const [ activeTab, setActiveTab ]=useState("Credit Card");
    const [cardToken ,setCardToken] = useState ("");
    const [cvvToken , setCvvToken ] = useState("")
    const [ccValid , setCcValid ]= useState(true); 
    const [cvvValid , setCvvValid ]= useState(true); 
    const [expMonth, setExpMonth] = useState('');
    const [expYear, setExpYear] = useState('');
    

    //General 
    const [submitPressed , setSubmitPressed ] = useState(false);

    
    
    const CreateSchedule =async() => 
    {
        setSubmitPressed(true);
        if( firstName == '' || lastName == '' || company == '' || Number(formData.amount) <= 0 || Number(formData.frequencyNum) <= 0 ) return ; 
        if( isCheck && (accountName == '' || accountNumber=='' || routingNumber == '' )   ) return ;
        if (!isCheck && (expMonth =='' || expYear == '' || cardToken=='' )) return; 
        const NewCustomer = {
            CustomerNumber: customerNumber , 
            CustomerNotes: note, 
            Email : email, 
            BillFirstName : firstName, 
            BillLastName : lastName, 
            BillCompany: company, 
            BillStreet : street, 
            BillCity : city, 
            BillState : state, 
            BillZip : zip
        }
        const NewPaymentMethod = {
            TokenType : formData.isCheck? "Check": "CC"
        }
        let  NewSchedule = {
            NewCustomer: NewCustomer, 
            NewPaymentMethod: NewPaymentMethod, 
            IntervalType: formData.frequency, 
            Amount : formData.includeFee && !formData.isCheck ? Number(formData.amount) + (formData.amount * formData.transferFee/100).toFixed(2) : formData.amount, 
            Description:formData.description, 
            Invoice:formData.invoice , 
            ScheduleName: formData.scheduleName, 
            IntervalCount:formData.frequencyNum, 
            FailedTransactionRetryTimes: formData.retryAttempts, 
            DaysBetweenRetries: formData.retryDays,
            SkipSaturdayAndHolidays:formData.skipDays,
            StartDate: formData.startDate, 
           
            AfterMaxRetriesAction: formData.afterFail
        }
        if (formData.endOption == "NumberOfPayments")
        {
            NewSchedule = {
                ...NewSchedule, 
                TotalPayments: formData.numberOfPayments
            }
        }
        if (formData.endOption == "Date")
        {
            NewSchedule = {
                ...NewSchedule, 
                EndDate: formData.endDate
            }
        }

        var CcInfo = {
            xCardNum: cardToken, 
            xCvv: cvvToken, 
            xExp: `${expMonth.value}${expYear.value}`
        }
        if (activeTab== "Credit Card")
        {
            NewSchedule = {...NewSchedule,
                ...CcInfo
            }

           const resp= await fetchWithAuth("create-new-schedule-cc", NewSchedule)
           
        }
        var CheckInfo = {
            
        }
       
    }

  useEffect(()=>{
    setFormData (
        {
            ...formData,
            isCheck : activeTab=="eCheck"
        }
    )
  }, [activeTab])


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

    // const setInvalidFields = () => {
    //     if (cardToken == "") {
    //         setCcValid(false);
    //     }
    //     if (cvvToken == "") {
    //         setCvvValid(false);
    //     }
    // }
    return <ConfirmationModal confirmButtonText={"Save"} onConfirm={CreateSchedule}  onClose={CloseNewSchedule}>
        
        <CustomerInfo
            firstName={firstName} setFirstName={setFirstName}
            lastName={lastName} setLastName={setLastName}
            company={company} setCompany={setCompany}
            note={note} setNote={setNote}
            customerNumber={customerNumber} setCustomerNumber={setCustomerNumber}
            street={street} setStreet={setStreet}
            city={city} setCity={setCity}
            state={state} setState={setState}
            zip={zip} setZip={setZip}
            phone={phone} setPhone={setPhone}
            email={email} setEmail={setEmail}
            submitPressed={submitPressed}
         />
         <section>
            <h3> Payment Info</h3>
        <PaymentTabs 
            tabs={tabs} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
        />
        </section>
      <SchedulingInfo 
        formData={formData} 
        submitPressed={submitPressed}  
        handleChange={handleScheduleChange}/>
   </ConfirmationModal>
}