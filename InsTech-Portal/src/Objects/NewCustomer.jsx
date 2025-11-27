import { useState } from "react";
import { ConfirmationModal } from "./ConfimationModal"
import { CustomerInfo } from "./CustomerInfo"
import { fetchWithAuth } from "../Utilities";

 export const NewCustomer = ({Close, OnSuccess})=> {
    
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
    
        const [submitPressed , setSubmitPressed] = useState(false);


         const CreateCustomer =async() => 
        {
            setSubmitPressed(true);
            if( firstName == '' || lastName == '' || company == '' ) return ; 
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
            const resp = await fetchWithAuth("create-customer", NewCustomer)

             if (resp.Error != "") {
            // Show error message if backend provided 
            const message = data.message || `Request failed: ${response.Error}`;
            //showError(message);
            console.error("Error:", message);
            return;
        }

        OnSuccess();

        }
        
    return <ConfirmationModal confirmButtonText={"Save"} onClose={Close} onConfirm={CreateCustomer}>
    
        
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
         </ConfirmationModal>
}