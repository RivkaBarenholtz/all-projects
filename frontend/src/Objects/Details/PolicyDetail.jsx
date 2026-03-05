import Detail from "../Detail"
import { useEffect, useState, useRef } from "react";
import { ActionButton } from "../../Components/UI/actionButton";
import { Link , Check, Mail, Upload } from "lucide-react";
import { fetchWithAuth } from "../../Utilities";
import { useSuccessModal } from "../SuccessModal";
import { Policy } from "../NewPolicy";
export function PolicyDetail({ policy, onClose }) {

    const policyRef = useRef();

    const [vendor, setVendor] = useState({});
    const [isEditMode, setIsEditMode] = useState(false);
    useEffect(() => {
        const getVendor = async () => {
            const result = await fetchWithAuth("get-vendor", {})
            setVendor(result);
        }
        getVendor();
    }, [])

    const { showSuccess, SuccessModal } = useSuccessModal();

    const generateSignAndPayLink = () => {
        const link = `https://pay.instechpay.co/${vendor?.subdomain}?policyid=${policy.PolicyId.replace("Policy#","")}&amount=${policy.PolicyAmount}`;
        return link;
    }

    const copyPaymentLinkToClipboard = () => {
        const link = generateSignAndPayLink();
        navigator.clipboard.writeText(link);
        showSuccess("Pay link copied to clipboard");
     }

     const SaveChanges=() => {
        if(policyRef.current){
            policyRef.current.submit();
        }
     }
     
    const body = () => {

        return <>
            
                  <button
                    title={isEditMode? "Save changes" :  "Edit"}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      marginRight: "10px",
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',

                    }}
                    onClick={() => { setIsEditMode(!isEditMode); SaveChanges() }}
                  >
                    {isEditMode ? "✔" : "✎"}
            </button>
            { !isEditMode? <><div className="trd-section">
                <h3 className="trd-section-title">Policy Information</h3>
                <div className="trd-info-grid">
                    <div className="trd-info-row">
                        <span className="trd-label">Policy Code:</span>
                        <span className="trd-value">{policy.PolicyCode}</span>
                    </div>
                    <div className="trd-info-row">
                        <span className="trd-label">Policy Description:</span>
                        <span className="trd-value">{policy.PolicyDescription}</span>
                    </div>
                    <div className="trd-info-row">
                        <span className="trd-label">Policy Amount:</span>
                        <span className="trd-value">{policy.PolicyAmountString}</span>
                    </div>
                    <div className="trd-info-row">
                        <span className="trd-label">Commission Amount:</span>
                        <span className="trd-value">{policy.CommissionAmountString}</span>
                    </div>
                    <div className="trd-info-row">
                        <span className="trd-label">Payable To Carrier:</span>
                        <span className="trd-value">{policy.PayableAmountString}</span>
                    </div>

                </div>
            </div>


            <div className="trd-section">
                <h3 className="trd-section-title">Customer Information</h3>
                <div className="trd-info-grid">
                    <div className="trd-info-row">
                        <span className="trd-label">Customer #:</span>
                        <span className="trd-value">{policy.CustomerNumber}</span>
                    </div>
                    <div className="trd-info-row">
                        <span className="trd-label">Email:</span>
                        <span className="trd-value">{policy.Email}</span>
                    </div>

                </div>
            </div>

            {/* Billing Info */}
            <div className="trd-section">
                <h3 className="trd-section-title">Billing Information</h3>
                <div className="trd-info-grid">
                    <div className="trd-info-row">
                        <span className="trd-label">First Name:</span>
                        <span className="trd-value">{policy.BillFirstName}</span>
                    </div>
                    <div className="trd-info-row">
                        <span className="trd-label">Last Name:</span>
                        <span className="trd-value">{policy.BillLastName}</span>
                    </div>
                    <div className="trd-info-row">
                        <span className="trd-label">Company:</span>
                        <span className="trd-value">{policy.BillCompany}</span>
                    </div>
                    <div className="trd-info-row">
                        <span className="trd-label">Address:</span>
                        <span className="trd-value">{policy.BillStreet}</span>
                    </div>
                    <div className="trd-info-row">
                        <span className="trd-label">Address Line 2:</span>
                        <span className="trd-value">{policy.BillStreet2}</span>
                    </div>

                    <div className="trd-info-row">
                        <span className="trd-label">City, State:</span>
                        <span className="trd-value">{policy.BillCity} , {policy.BillState} {policy.Zip}</span>
                    </div>
                    <div className="trd-info-row">
                        <span className="trd-label">Phone:</span>
                        <span className="trd-value">{policy.BillPhone}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                         {!policy.IsSignedAndPaid  ?

                        <>
                             
                            <ActionButton onClick={copyPaymentLinkToClipboard}>
                                <Link/> Copy Policy Sign & Pay Link
                            </ActionButton>
                            <ActionButton >
                                <Mail/> Email Policy Sign & Pay Link
                            </ActionButton>
                        </>
                        :
                        <span style={{display:"flex", justifyContent:"center", gap: "5px",backgroundColor:"#185c3f", color:"white"}}><Check/> Policy Signed & Paid</span>

                        }

      
                    </div>
                </div>
            </div>
            </>: 
            <Policy 
                ref={policyRef} 
                isEdit={true} 
                policy={policy} 
                OnSuccess={() => { setIsEditMode(false); showSuccess("Policy updated successfully")}}/>
        }
        </>

    }

    return <><SuccessModal/><Detail title={"Policy Info"} body={body()} onClose={onClose} /></>

}