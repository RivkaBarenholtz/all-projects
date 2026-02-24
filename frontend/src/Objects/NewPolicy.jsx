import { useState, forwardRef, useImperativeHandle } from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { CustomerInfo } from "./CustomerInfo";
import { fetchWithAuth } from "../Utilities";

export const Policy = forwardRef(
  ({ Close, OnSuccess, isEdit, customerID , policy,  }, ref) => {

    // ------------------------
    // State
    // ------------------------
    const [firstName, setFirstName] = useState(policy?.customer?.BillFirstName??"");
    const [lastName, setLastName] = useState(policy?.customer?.BillLastName??"");
    const [company, setCompany] = useState(policy?.customer?.BillCompany??"");
    const [note, setNote] = useState(policy?.customer?.CustomerNotes??"");
    const [customerNumber, setCustomerNumber] = useState(policy?.customer?.CustomerNumber??"");
    const [street, setStreet] = useState(policy?.customer?.BillStreet??"");
    const [city, setCity] = useState(policy?.customer?.BillCity??"");
    const [state, setState] = useState(policy?.customer?.BillState??"");
    const [zip, setZip] = useState(policy?.customer?.BillZip??"");
    const [phone, setPhone] = useState(policy?.customer?.BillPhone??"");
    const [email, setEmail] = useState(policy?.customer?.Email??"");

    const [policyCode, setPolicyCode] = useState(policy?.PolicyCode??"");
    const [policyDescription, setPolicyDescription] = useState(policy?.PolicyDescription??"");
    const [policyAmount, setPolicyAmount] = useState(policy?.PolicyAmount??"");

    const [submitPressed, setSubmitPressed] = useState(false);

    // ------------------------
    // AJAX logic (single source of truth)
    // ------------------------
    const CreateOrUpdatePolicy = async () => {
      setSubmitPressed(true);

      if (!firstName || !lastName  || !policyCode || !policyDescription || !policyAmount || !email) return;

     
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
        BillZip: zip
      };
      const NewPolicy = {
        PolicyCode: policyCode,
        PolicyDescription: policyDescription,
        Amount: policyAmount,
        Customer: NewCustomer,
        ... (isEdit ? { PolicyId: policy.PolicyId} : {})
      };

      const urlEndpoint = isEdit ? "update-policy" : "create-policy";
      const resp = await fetchWithAuth(urlEndpoint, NewPolicy);

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
      submit: CreateOrUpdatePolicy
    }));

    const custInfo = (
        <>
         <section className="form-section">
        <h3>Policy Info</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Policy Code</label>
            <input
              type="text"
              value={policyCode}
              onChange={(e) => setPolicyCode(e.target.value)}
            />
            {submitPressed && policyCode == "" ? <div className="toast show" id="toast-for-account-holder">Policy Code required.</div> : ''}

          </div>
          
          <div className="form-group">
            <label>Policy Description *</label>
            <input
              type="text"
              value={policyDescription}
              onChange={(e) => setPolicyDescription(e.target.value)}
            />
              {submitPressed && policyDescription == "" ? <div className="toast show" id="toast-for-account-holder">Policy Description required.</div> : ''}

          </div>
        </div>

        <div className="form-group">
          <label>Amount *</label>
          <input
            type="text"
            value={policyAmount}
            onChange={(e) => setPolicyAmount(e.target.value)}
          />
           {submitPressed && policyAmount == "" ? <div className="toast show" id="toast-for-account-holder">Amount required.</div> : ''}

        </div>

      </section>
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

      </>
    );

    return isEdit ? (
      custInfo
    ) : (
      <ConfirmationModal
        confirmButtonText="Save"
        onClose={Close}
        onConfirm={CreateOrUpdatePolicy}
      >
        {custInfo}
      </ConfirmationModal>
    );
  }
);
