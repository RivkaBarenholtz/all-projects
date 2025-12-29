import { useState, forwardRef, useImperativeHandle } from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { CustomerInfo } from "./CustomerInfo";
import { fetchWithAuth } from "../Utilities";

export const NewCustomer = forwardRef(
  ({ Close, OnSuccess, isEdit, customerID , customer }, ref) => {

    // ------------------------
    // State
    // ------------------------
    const [firstName, setFirstName] = useState(customer?.BillFirstName??"");
    const [lastName, setLastName] = useState(customer?.BillLastName??"");
    const [company, setCompany] = useState(customer?.BillCompany??"");
    const [note, setNote] = useState(customer?.CustomerNotes??"");
    const [customerNumber, setCustomerNumber] = useState(customer?.CustomerNumber??"");
    const [street, setStreet] = useState(customer?.BillStreet??"");
    const [city, setCity] = useState(customer?.BillCity??"");
    const [state, setState] = useState(customer?.BillState??"");
    const [zip, setZip] = useState(customer?.BillZip??"");
    const [phone, setPhone] = useState(customer?.BillPhone??"");
    const [email, setEmail] = useState(customer?.Email??"");

    const [submitPressed, setSubmitPressed] = useState(false);

    // ------------------------
    // AJAX logic (single source of truth)
    // ------------------------
    const CreateOrUpdateCustomer = async () => {
      setSubmitPressed(true);

      if (!firstName || !lastName || !company) return;

      const CustomerId = isEdit ? 
      { 
        CustomerId: customerID, 
        Revision: customer.Revision ,
        DefaultPaymentMethodID: customer.DefaultPaymentMethodId
      } : {};

      const NewCustomer = {
        CustomerNumber: customerNumber,
        CustomerNotes: note,
        Email: email,
        BillFirstName: firstName,
        BillPhone: phone, 
        BillLastName: lastName,
        BillCompany: company,
        BillStreet: street,
        BillCity: city,
        BillState: state,
        BillZip: zip,
        ...CustomerId
      };

      const urlEndpoint = isEdit ? "update-customer" : "create-customer";
      const resp = await fetchWithAuth(urlEndpoint, NewCustomer);

      if (resp.Error) {
        console.error("Error:", resp.Error);
        return;
      }

      OnSuccess();
    };

    // ------------------------
    // Expose function to parent
    // ------------------------
    useImperativeHandle(ref, () => ({
      submit: CreateOrUpdateCustomer
    }));

    const custInfo = (
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
    );

    return isEdit ? (
      custInfo
    ) : (
      <ConfirmationModal
        confirmButtonText="Save"
        onClose={Close}
        onConfirm={CreateOrUpdateCustomer}
      >
        {custInfo}
      </ConfirmationModal>
    );
  }
);
