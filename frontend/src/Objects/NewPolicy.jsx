import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { CustomerInfo } from "./CustomerInfo";
import { fetchWithAuth, extractPages, uploadToS3 } from "../Utilities";
import { TextractBedrockProcessor } from "./BedrockProcessor";
import { X } from "lucide-react";

export const Policy = forwardRef(
  ({ Close, OnSuccess, isEdit, policyId, policy, }, ref) => {

    // ------------------------
    // State
    // ------------------------
    const [firstName, setFirstName] = useState(policy?.customer?.BillFirstName ?? "");
    const [lastName, setLastName] = useState(policy?.customer?.BillLastName ?? "");
    const [company, setCompany] = useState(policy?.customer?.BillCompany ?? "");
    const [note, setNote] = useState(policy?.customer?.CustomerNotes ?? "");
    const [customerNumber, setCustomerNumber] = useState(policy?.customer?.CustomerNumber ?? "");
    const [street, setStreet] = useState(policy?.customer?.BillStreet ?? "");
    const [city, setCity] = useState(policy?.customer?.BillCity ?? "");
    const [state, setState] = useState(policy?.customer?.BillState ?? "");
    const [zip, setZip] = useState(policy?.customer?.BillZip ?? "");
    const [phone, setPhone] = useState(policy?.customer?.BillPhone ?? "");
    const [email, setEmail] = useState(policy?.customer?.Email ?? "");
    const [file, setFile] = useState(null);
    const [policyCode, setPolicyCode] = useState(policy?.PolicyCode ?? "");
    const [policyDescription, setPolicyDescription] = useState(policy?.PolicyDescription ?? "");
    const [policyAmount, setPolicyAmount] = useState(policy?.PolicyAmount ?? "");
    const [commissionAmount, setCommissionAmount] = useState(policy?.CommissionAmount ?? "");
    const [jobId, setJobId] = useState("");

    const [bedrockResult, setBedrockResult] = useState(null);

    const [submitPressed, setSubmitPressed] = useState(false);

    useEffect(() => {
        if (bedrockResult && file) {
          if(policyCode == "" || policyCode == null) setPolicyCode(bedrockResult.PolicyId ?? "");
          if(street == "" || street == null) setStreet(bedrockResult.CustomerAddressLine1 ?? "");
          if(policyDescription == "" || policyDescription == null) setPolicyDescription(bedrockResult.PolicyName ?? "");
          if(state == "" || state == null) setState(bedrockResult.CustomerState ?? "");
          if(city == "" || city == null) setCity(bedrockResult.CustomerCity ?? "");
          if(zip == "" || zip == null) setZip(bedrockResult.CustomerZip ?? "");
          if(email == "" || email == null) setEmail(bedrockResult.CustomerEmail ?? "");
          if(phone == "" || phone == null) setPhone(bedrockResult.CustomerPhone ?? "");
          if(company == "" || company == null) setCompany(bedrockResult.CustomerName ?? "");
          if(policyAmount == "" || policyAmount == null || policyAmount) setPolicyAmount(bedrockResult.TotalPremiumAmount.replace('$', '').replace(',', '') ?? 0);
        }
      }, [bedrockResult])

    


    // const fileToBase64 = (file) => {
    //   return new Promise((resolve, reject) => {
    //     const reader = new FileReader();
    //     reader.readAsDataURL(file);
    //     reader.onload = () => resolve(reader.result);
    //     reader.onerror = (error) => reject(error);
    //   });
    // }

    const analyzePDF = async (file) => {
      if (!file) return;
      const presignedRsp = await fetchWithAuth("get-presigned-url", { });
      const {uploadUrl, fileName} = presignedRsp;

       //const blob = await  extractPages(file,0, 5);
       await uploadToS3(file, uploadUrl);
       const policy = await fetchWithAuth("analyze-policy-document", { fileName : `temp-${fileName}`});
       setJobId(policy.jobId);
    };

    const SaveFile = async (file, url ) => {
     await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/pdf"
        },
        body: file
      });
    }

    const handleFileChange = async (e) => {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await analyzePDF(selectedFile);
      
    }


    const CreateOrUpdatePolicy = async () => {
      setSubmitPressed(true);

      if (!firstName || !lastName || !policyCode || !policyDescription || !policyAmount || !email) return;


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
        ...policy,
        PolicyCode: policyCode,
        PolicyDescription: policyDescription,
        Amount: policyAmount,
        CommissionAmount : commissionAmount,
        QuoteFileName: file ? file.name : "",
        Customer: NewCustomer,
        ... (isEdit ? { PolicyId: policy.PolicyId } : {})
      };

      const urlEndpoint = isEdit ? "update-policy" : "create-policy";

      const resp = await fetchWithAuth(urlEndpoint, NewPolicy);

      if (resp.Error) {
        console.error("Error:", resp.Error);
        return;
      }
      if (file) await SaveFile(file, resp.UploadUrl);
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


          
          { !file && <div className="form-group">
            <label>Policy Contract</label>
            <input
              type="file"
              id="file"
              accept=".pdf"

              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(49, 43, 43, 0.2)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}

            />
          </div>
          }

          {
            jobId && jobId != "" && <TextractBedrockProcessor bedrockResult={bedrockResult} setBedrockResult={setBedrockResult} jobId={jobId} />
          }
          {file && <div className="form-group"><span style={{fontWeight:"bold"}}>Selected file:</span> {file.name} 
          <span style={{fontWeight:"bold", paddingLeft:"10px", cursor:"pointer"}} title="Remove file">
            <X  size={11} onClick={()=> setFile(null)}/>
          </span> </div>}

          
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
       
          
          <div className="form-row">
          
            <div className="form-group">
              <label>Amount *</label>
              <input
                type="text"
                value={policyAmount}
                onChange={(e) => setPolicyAmount(e.target.value)}
              />
              {submitPressed && policyAmount == "" ? <div className="toast show" id="toast-for-account-holder">Amount required.</div> : ''}

            </div>
            <div className="form-group">
              <label>Commission Amount *</label>
              <input
                type="text"
                value={commissionAmount}
                onChange={(e) => setCommissionAmount(e.target.value)}
              />
              {submitPressed && commissionAmount == "" ? <div className="toast show" id="toast-for-account-holder">Commission Amount required.</div> : ''}

            </div>
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
