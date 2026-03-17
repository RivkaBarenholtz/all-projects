import { useState, forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { CustomerInfo } from "./CustomerInfo";
import { fetchWithAuth, extractPages, uploadToS3, FormatCurrency } from "../Utilities";
import { TextractBedrockProcessor } from "./BedrockProcessor";
import { CustomerSearch } from "../Objects/CustomerSearch";
import { ActionButton } from "../Components/UI/actionButton";
import { PdfViewer } from "./PdfViewer";
import { AiField } from "./AiField";

import { X } from "lucide-react";

export const Policy = forwardRef(
  ({ Close, OnSuccess, isEdit, policyId, policy,hideCustomer }, ref) => {

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
    const [customerId , setCustomerId]= useState(policy?.Customer?.CustomerId??"") ;
    const [file, setFile] = useState(null);
    const [policyCode, setPolicyCode] = useState(policy?.PolicyCode ?? "");
    const [policyDescription, setPolicyDescription] = useState(policy?.PolicyDescription ?? "");
    const [policyAmount, setPolicyAmount] = useState(policy?.PolicyAmount ?? "");
    const [commissionAmount, setCommissionAmount] = useState(policy?.CommissionAmount ??0);
    const [jobId, setJobId] = useState("");
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [premadeCustomer, setPremadeCustomer] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isManual, setIsManual] = useState(null);
    const [subbroker, setSubbroker] = useState("");
    const [policyStart, setPolicyStart] = useState(policy?.PolicyStartDate??new Date);
    const [policyEnd, setPolicyEnd] = useState(policy?.PolicyEndDate??new Date);
    const [carrier, setCarrier] = useState(policy?.CarrierName??"");
    const [subbrokerCommission, setSubbrokerCommission] = useState(0);
    const [highlightText, setHighlightText] = useState("")
    const [paidToCarrier, setPaidToCarrier] = useState(policy?.PaidToCarrier)
    const [customerPaid, setCustomerPaid] = useState(policy?.PaidByCustomer)



    const [bedrockResult, setBedrockResult] = useState(null);
    const [bedrockFilledFields, setBedrockFilledFields] = useState(new Set());
    const [editingFields, setEditingFields] = useState(new Set());

    const isLocked = (field) => bedrockFilledFields.has(field) && !editingFields.has(field);
    const unlockField = (field) => setEditingFields(prev => new Set([...prev, field]));

    const [submitPressed, setSubmitPressed] = useState(false);

    useEffect(() => {
      if (bedrockResult && file) {
        const filled = new Set();

        const applyField = (setter, value, field) => {
          setter(value ?? "");
          if (value) filled.add(field);
        };

        applyField(setPolicyCode,        bedrockResult.PolicyId,                                                          'policyCode');
        applyField(setPolicyDescription, bedrockResult.PolicyName,                                                       'policyDescription');
        applyField(setPolicyAmount,      bedrockResult.TotalPremiumAmount ? bedrockResult.TotalPremiumAmount.replace('$', '').replace(',', '') : "", 'policyAmount');
        applyField(setCarrier,           bedrockResult.Carrier,                                                          'carrier');
        applyField(setPolicyStart,       bedrockResult.PolicyStartDate,                                                  'policyStart');
        applyField(setPolicyEnd,         bedrockResult.PolicyEndDate,                                                    'policyEnd');
        applyField(setStreet,            bedrockResult.CustomerAddressLine1,                                             'street');
        applyField(setState,             bedrockResult.CustomerState,                                                    'state');
        applyField(setCity,              bedrockResult.CustomerCity,                                                     'city');
        applyField(setZip,               bedrockResult.CustomerZip,                                                      'zip');
        applyField(setEmail,             bedrockResult.CustomerEmail,                                                    'email');
        applyField(setPhone,             bedrockResult.CustomerPhone,                                                    'phone');
        applyField(setCompany,           bedrockResult.CustomerName,                                                     'company');

        setBedrockFilledFields(filled);
        setEditingFields(new Set());
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
      if (!isManual) {
        setIsManual(false);//if it was null 
        await analyzePDF(selectedFile);
      }

    }


    const CreateOrUpdatePolicy = async () => {
      setSubmitPressed(true);

      if (!firstName || !lastName || !policyCode || !policyDescription || !policyAmount || !email) return;


      const NewCustomer = {
        CustomerId : customerId, 
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
        PolicyStartDate: policyStart,
        PolicyEndDate: policyEnd,
        CarrierName: carrier,
        SubbrokerName: subbroker,
        SubbrokerAmount: subbrokerCommission,
        Amount: policyAmount,
        CommissionAmount: commissionAmount,
        QuoteFileName: file ? file.name : "",
        Customer: premadeCustomer ?? NewCustomer,
        PaidToCarrier: paidToCarrier,
        PaidByCustomer: customerPaid,
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

        {
          showCustomerSearch &&
          <CustomerSearch
            onSelectCustomer={(a) => { setPremadeCustomer(a); setShowCustomerSearch(false) }}
            onClose={() => setShowCustomerSearch(false)} />
        }

        {
          isManual == null && !isEdit && <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div>
              <ActionButton style={{ width: "100%" }} onClick={() => setIsManual(true)} >
                Enter Manually
              </ActionButton >

            </div>
            <div>
              <ActionButton style={{ width: "100%" }} onClick={() => openFileDialog()} >
                AI Analyze Pdf
              </ActionButton>
            </div>
          </div>}
        {(isManual !== null || isEdit) && <>
          <section className="form-section">
            <h3>Policy Info</h3>



            {
              !file && <div className="form-group">
                <label>Policy Contract</label>
                <button type="button" style={{ width: "100%", borderRadius: "5px", padding: "10px", cursor: "pointer" }} onClick={openFileDialog} >
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
              <AiField field="policyCode" locked={isLocked('policyCode')} onUnlock={unlockField} onHighlight={setHighlightText}>
                <input
                  type="text"
                  value={policyCode}
                  onChange={(e) => setPolicyCode(e.target.value)}
                  onFocus={() => setHighlightText(policyCode)}
                />
              </AiField>
              {submitPressed && policyCode == "" ? <div className="toast show" id="toast-for-account-holder">Policy Code required.</div> : ''}
            </div>

            <div className="form-group">
              <label>Policy Description *</label>
              <AiField field="policyDescription" locked={isLocked('policyDescription')} onUnlock={unlockField} onHighlight={setHighlightText}>
                <input
                  type="text"
                  value={policyDescription}
                  onChange={(e) => setPolicyDescription(e.target.value)}
                  onFocus={() => setHighlightText(policyDescription)}
                />
              </AiField>
              {submitPressed && policyDescription == "" ? <div className="toast show" id="toast-for-account-holder">Policy Description required.</div> : ''}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Amount *</label>
                <AiField field="policyAmount" locked={isLocked('policyAmount')} onUnlock={unlockField} onHighlight={setHighlightText}>
                  <input
                    type="text"
                    value={policyAmount}
                    onChange={(e) => setPolicyAmount(e.target.value)}
                    onFocus={() => setHighlightText(FormatCurrency(policyAmount))}
                  />
                </AiField>
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
              <AiField field="carrier" locked={isLocked('carrier')} onUnlock={unlockField} onHighlight={setHighlightText}>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  onFocus={() => setHighlightText(carrier)}
                />
              </AiField>
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
                <AiField field="policyStart" locked={isLocked('policyStart')} onUnlock={unlockField} onHighlight={setHighlightText}>
                  <input
                    type="date"
                    value={policyStart}
                    onChange={(e) => setPolicyStart(e.target.value)}
                  />
                </AiField>
              </div>
              <div className="form-group">
                <label>Policy End Date</label>
                <AiField field="policyEnd" locked={isLocked('policyEnd')} onUnlock={unlockField} onHighlight={setHighlightText}>
                  <input
                    type="date"
                    value={policyEnd}
                    onChange={(e) => setPolicyEnd(e.target.value)}
                  />
                </AiField>
              </div>
            </div>
            {isEdit && <>
             <div className="form-row">

              
             <div className="form-group">
                <label>Customer Paid</label>
                <input
                  type="number"
                  value={customerPaid}
                  onChange={(e) => setCustomerPaid(e.target.value)}
                />

              </div>
              <div className="form-group">
                <label>Customer Balance</label>
                <input
                  type="text"
                  disabled
                  value={policyAmount- (customerPaid??0)}
                  
                  
                />
              </div>
              </div>
              <div className="form-row">

              <div className="form-group">
                <label>Paid to Carrier</label>
                <input
                  type="number"
                  value={paidToCarrier}
                  onChange={(e) => setPaidToCarrier(e.target.value)}
                />

              </div>
              <div className="form-group">
                <label>Owed to Carrier</label>
                <input
                  type="number"
                  disabled
                  value={(policyAmount - commissionAmount)- (paidToCarrier??0)}
                  onChange={(e) => setPaidToCarrier(e.target.value)}
                />

              </div>
              </div>
            </>}

          </section>
          { !hideCustomer &&  <>
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
                isLocked={isLocked}
                unlockField={unlockField}
                onHighlight={setHighlightText}
              />
            </>}
          </>}
        </>}
      </>
    );

    return isEdit ? (
      <>
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

        {custInfo}</>
    ) : (
      <>
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
        <ConfirmationModal
          confirmButtonText="Save"
          onClose={Close}
          showButton={isManual !== null}
          maxWidth={pdfUrl ? "1400px" : (showCustomerSearch ? "800px" : "430px")}
          onConfirm={CreateOrUpdatePolicy}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
           
            <div style={{ width: "364px", flexShrink: 0 }}>{custInfo}</div>
             {pdfUrl && <PdfViewer fileUrl={pdfUrl} searchText={highlightText} />}
          </div>
        </ConfirmationModal>
      </>
    );
  }
);
