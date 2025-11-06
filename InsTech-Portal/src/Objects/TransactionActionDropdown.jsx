import {  useState } from "react";
import { Dropdown } from "./Dropdown";
import { MoreVertical, X, RotateCcw } from "lucide-react";
import { ConfirmationModal } from "./ConfimationModal";
import { FormatCurrency, fetchWithAuth } from "../Utilities";

import { useAsync } from "react-select/async";

export const TransactionActionDropdown =({transaction, closeDropdown})=> 
{
    const [showVoidConfirm, setShowVoidConfirm] = useState(false);
    const [showRefundConfirm, setShowRefundConfirm] = useState(false);

    const [ refundOption, setRefundOption]= useState("Full");
    const [partialAmount, setPartialAmount] = useState(0);

    const [show, setShow] = useState(true);

    const VoidTransaction = async()=> 
    {
        const voidRequest =
        { 
            OriginalTransaction:transaction.xRefNum, 
            IsCheck:transaction.xCommand.toLowerCase().includes("check")
        }
        await fetchWithAuth("void-transaction", voidRequest );
        setShowVoidConfirm(false);
        setShow(!show);
    }
    
    const RefundTransaction = async()=>
    {
        let RefundRequest  = 
        {
            ...transaction,
            OriginalTransaction:transaction.xRefNum,
            IsCheck:transaction.xCommand.toLowerCase().includes("check"),
            Subtotal: transaction.xCustom10 == 0 || transaction.xCustom10 == null?transaction.xAmount: transaction.xCustom10, 
            Surcharge: transaction.xCustom09??0
        }
        if(refundOption=="Partial")
        {
            const surchargePercent = RefundRequest.Surcharge/ RefundRequest.Subtotal;
            const surchargeAmount = surchargePercent * partialAmount; 
            const subtotalAmount = partialAmount;
            RefundRequest ={
                ...RefundRequest,
                Subtotal:subtotalAmount,
                Surcharge:surchargeAmount
            }
        }
        await fetchWithAuth("issue-refund-cardknox", RefundRequest );
        setShowRefundConfirm(false);
        setShow(!show);

    }

    const buttonContent = <MoreVertical/>
    return <Dropdown classes={"transaction-action"} buttonContent={ buttonContent} buttonClasses = "trd-btn" show={show} >
       { showVoidConfirm && <ConfirmationModal onConfirm={VoidTransaction} onClose={()=>{setShowVoidConfirm(false); setShow(!show)}} confirmButtonText="Void" >
        <div className="all-padding-bottom">
            <h2>Void Transaction</h2>
            <span>Are you sure you want to void this transaction?</span>
            <div>
                <div className="trd-info-row">
                    <span className="amount trd-transaction-id">{FormatCurrency(transaction.xAmount)}</span>
                </div>
                <div className="trd-info-row">
                    <span className="trd-label">Ref #:</span>
                    <span className="trd-value"> {transaction.xRefNum}</span>
                  </div>
                 <div className="trd-info-row">
                    <span className="trd-label">Account #:</span>
                    <span className="trd-value"> {transaction.xMaskedAccountNumber}</span>
                  </div>
            </div>
        </div>
       </ConfirmationModal>  }
       { showRefundConfirm && <ConfirmationModal onConfirm={RefundTransaction} onClose={()=>{setShowRefundConfirm(false)} }  confirmButtonText="Issue Refund">
            
        <div className="all-padding-bottom">
            <h2>Refund Transaction</h2>
           <div>
                <div >
                    <div style={{fontSize:"14px"}}>Original Amount
                        <span className="refund-large">{FormatCurrency(transaction.xAmount)}</span>
                    </div>
                </div>
                 <div >
                    <div style={{fontSize:"14px"}}> Ref #
                        <span className="refund-large">{transaction.xRefNum  }</span>
                    </div>
                </div>
                
                
                  <div className="radio-group">
                    <div>
                        <label className="radio-option">
                            <input name="refundOption" type="radio" onChange={()=>{setRefundOption('Full')}}  checked={refundOption=='Full'}  value='Full'/> 
                        
                            <strong>Full Refund</strong>
                        </label>
                    </div>
                    <div>
                        <label className="radio-option">
                            <input name="refundOption" type="radio" onChange={()=>{setRefundOption('Partial')}} checked={refundOption=='Partial'} value='Partial'/>
                        
                            <strong>Partial Refund</strong>
                             {refundOption === "Partial" && (
                                <div className="partial-div">
                                <span>$</span>
                                <input
                                type="number"
                                className="partial-input"
                                placeholder="Enter partial refund amount"
                                value={partialAmount}
                                onChange={(e) => setPartialAmount(e.target.value)}
                                />
                                </div>
                            )}
                        </label>

                    </div>

                  </div>
            </div>
        </div>

       </ConfirmationModal>  }

       <ul>
            <li onClick={()=>{setShowVoidConfirm(true)}}>
               <X style={{marginRight:"10px"}}/>  Void
            </li>
            <li onClick={()=>{setShowRefundConfirm(true)}}>
               <RotateCcw style={{marginRight:"10px"}}/> Refund
            </li>
            
        </ul>
   </Dropdown>
}