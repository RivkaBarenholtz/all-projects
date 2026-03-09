import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { CustomerInfo } from "./CustomerInfo";
import { fetchWithAuth, extractPages, uploadToS3 } from "../Utilities";
import { TextractBedrockProcessor } from "./BedrockProcessor";
import { CustomerSearch } from "../Objects/CustomerSearch";
import { ActionButton } from "../Components/UI/actionButton";


import { X } from "lucide-react";

export const Policy = forwardRef(
  ({ Close, OnSuccess, isEdit, policyId, policy, }, ref) => {

    const fileInputRef = useRef(null);

    // ------------------------
    // State
    // ------------------------
    const [firstName, setFirstName] = useState(policy?.Customer?.BillFirstName ?? "");
    const [lastName, setLastName] = useState(policy?.Customer?.BillLastName ?? "");
    const [company, setCompany] = useState(policy?.Customer?.BillCompany ?? "");
    const [note, setNote] = useState(policy?.Customer?.CustomerNotes ?? "");
    const [customerNumber, setCustomerNumber] = useState(policy?.Customer?.CustomerNumber ?? "");
    const [street, setStreet] = useState(policy?.Customer?.BillStreet ?? "");
    const [city, setCity] = useState(policy?.Customer?.BillCity ?? "");
    const [state, setState] = useState(policy?.Customer?.BillState ?? "");
    const [zip, setZip] = useState(policy?.Customer?.BillZip ?? "");
    const [phone, setPhone] = useState(policy?.Customer?.BillPhone ?? "");
    const [email, setEmail] = useState(policy?.Customer?.Email ?? "");
    const [file, setFile] = useState(null);
    const [policyCode, setPolicyCode] = useState(policy?.PolicyCode ?? "");
    const [policyDescription, setPolicyDescription] = useState(policy?.PolicyDescription ?? "");
    const [policyAmount, setPolicyAmount] = useState(policy?.PolicyAmount ?? "");
    const [commissionAmount, setCommissionAmount] = useState(policy?.CommissionAmount ?? "");
    const [jobId, setJobId] = useState("");
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [premadeCustomer, setPremadeCustomer] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isManual, setIsManual] = useState(null);
    const [subbroker, setSubbroker] = useState(null);
    const [policyStart, setPolicyStart] = useState(null);
    const [policyEnd, setPolicyEnd] = useState(null);
    const [carrier, setCarrier] = useState(null);
    const [subbrokerCommission, setSubbrokerCommission] = useState(null);



    const [bedrockResult, setBedrockResult] = useState(null);

    const [submitPressed, setSubmitPressed] = useState(false);

    useEffect(() => {
      if (bedrockResult && file) {
        setPolicyCode(bedrockResult.PolicyId ?? "");
        setStreet(bedrockResult.CustomerAddressLine1 ?? "");
        setPolicyDescription(bedrockResult.PolicyName ?? "");
        setState(bedrockResult.CustomerState ?? "");
        setCity(bedrockResult.CustomerCity ?? "");
        setZip(bedrockResult.CustomerZip ?? "");
        setEmail(bedrockResult.CustomerEmail ?? "");
        setPhone(bedrockResult.CustomerPhone ?? "");
        setCompany(bedrockResult.CustomerName ?? "");
        setPolicyAmount(bedrockResult.TotalPremiumAmount.replace('$', '').replace(',', '') ?? 0);
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

    const openFileDialog = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };



    const analyzePDF = async (file) => {
      if (!file) return;
      const presignedRsp = await fetchWithAuth("get-presigned-url", {});
      const { uploadUrl, fileName } = presignedRsp;

      //const blob = await  extractPages(file,0, 5);
      await uploadToS3(file, uploadUrl);
      const policy = await fetchWithAuth("analyze-policy-document", { fileName: `temp-${fileName}` });
      setJobId(policy.jobId);
      setBedrockResult(null);
    };

    const SaveFile = async (file, url) => {
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
      setPdfUrl(URL.createObjectURL(selectedFile));
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
        PolicyStartDate : policyStart, 
        PolicyEndDate : policyEnd, 
        CarrierName: carrier, 
        SubbrokerName: subbroker, 
        SubbrokerAmount: subbrokerCommission, 
        Amount: policyAmount,
        CommissionAmount: commissionAmount,
        QuoteFileName: file ? file.name : "",
        Customer: premadeCustomer ?? NewCustomer,
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
        {
          !isManual && !isEdit && jobId && jobId != "" && <TextractBedrockProcessor bedrockResult={bedrockResult} setBedrockResult={setBedrockResult} jobId={jobId} />
        }
        <input
          type="file"
          id="file"
          accept=".pdf"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{
            display: "none"
          }}

        />
        {
          showCustomerSearch &&
          <CustomerSearch
            onSelectCustomer={(a) => { setPremadeCustomer(a); setShowCustomerSearch(false) }}
            onClose={() => setShowCustomerSearch(false)} />
        }

        {
          isManual == null && !isEdit &&  <div  style={{display:"flex", flexDirection: "column"}}> 
          <div>
            <input type="radio" checked={isManual === true} name="isManual" onChange={() => setIsManual(true)} style={{margin:"4px"}}/>
            Enter Manually
          </div>
          <div>
            <input type="radio" checked={isManual === false} name="isManual"  style={{margin:"4px"}} onChange={() => { setIsManual(false); openFileDialog(); }} />
            Analyze Document
            </div>
          </div>}
        {(isManual !== null || isEdit )&& <>
          <section className="form-section">
            <h3>Policy Info</h3>



            {
              <div className="form-group">
                <label>Policy Contract</label>
                <button type="button" onClick={openFileDialog} >
                  Upload Document
                </button>
              </div>
            }


            {file && <div className="form-group"><span style={{ fontWeight: "bold" }}>Selected file:</span> {file.name}
              <span style={{ fontWeight: "bold", paddingLeft: "10px", cursor: "pointer" }} title="Remove file">
                <X size={11} onClick={() => { setFile(null); setPdfUrl("") }} />
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
                <label>Commission Amount</label>
                <input
                  type="text"
                  value={commissionAmount}
                  onChange={(e) => setCommissionAmount(e.target.value)}
                />
               
              </div>
            </div>
            <div className="form-group">
                <label>Carrier</label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                />
               
            </div>
             <div className="form-row">
              <div className="form-group">
                  <label>Subbroker</label>
                  <input
                    type="text"
                    value={subbroker}
                    onChange={(e) => setSubbroker(e.target.value)}
                  />
               </div>
               <div className="form-group">
                  <label>Subbroker Commission</label>
                  <input
                    type="text"
                    value={subbrokerCommission}
                    onChange={(e) => setSubbrokerCommission(e.target.value)}
                  />
               </div>
            </div>
            <div className="form-row">

              <div className="form-group">
                <label>Policy Start Date</label>
                <input
                  type="date"
                  value={policyStart}
                  onChange={(e) => setPolicyStart(e.target.value)}
                />
                
              </div>
              <div className="form-group">
                <label>Policy End Date</label>
                <input
                  type="date"
                  value={policyEnd}
                  onChange={(e) => setPolicyEnd(e.target.value)}
                />
               
              </div>
            </div>

          </section>
          {premadeCustomer && !isEdit && <div>
            Using preexisting customer {premadeCustomer.BillCompany || premadeCustomer.BillFirstName}
            <span style={{ fontWeight: "bold", paddingLeft: "10px", cursor: "pointer" }} title="">
              <X size={11} onClick={() => setPremadeCustomer(null)} />
            </span>
          </div>}
          {!premadeCustomer && <> {!isEdit && <ActionButton onClick={() => setShowCustomerSearch(true)}>
            Existing Customer
          </ActionButton>}
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
          </>}
        </>}
      </>
    );

    return isEdit ? (
      custInfo
    ) : (
      <>
        {pdfUrl && (
          <iframe src={pdfUrl} style={{
            width: "800px",
            height: "100%",
            position: "fixed",
            zIndex: 1000,
            right: 0,
            top: 0
          }} />
        )}
        <ConfirmationModal
          confirmButtonText="Save"
          onClose={Close}
          showButton = {isManual !== null }
          maxWidth={showCustomerSearch ? "800px" : "430px"}
          rightOffset={pdfUrl ? "800px" : "0px"}
          onConfirm={CreateOrUpdatePolicy}
        >


          {custInfo}
        </ConfirmationModal>
      </>
    );
  }
);
