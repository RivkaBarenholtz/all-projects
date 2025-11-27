import {  useState } from "react";
import { Dropdown } from "./Dropdown";
import { MoreVertical, X, RotateCcw, Check, Plus } from "lucide-react";
import { ConfirmationModal } from "./ConfimationModal";
import { FormatCurrency, fetchWithAuth } from "../Utilities";

import { useAsync } from "react-select/async";

export const TransactionActionDropdown =({transaction, getTransactions })=> 
{
    const [showVoidConfirm, setShowVoidConfirm] = useState(false);
    const [showRefundConfirm, setShowRefundConfirm] = useState(false);
    const [showNewTransaction, setShowNewTransaction] = useState(false);
    const [showConfirmWire, setShowConfirmWire] = useState(false);

    const [ refundOption, setRefundOption]= useState("Full");
    const [partialAmount, setPartialAmount] = useState(0);
    const [newTransactionAmount , setNewTransactionAmount]= useState(0);

    const [show, setShow] = useState(true);

    const VoidTransaction = async()=> 
    {
        if(transaction.xCommand.includes("Wire"))
        {
            VoidWireTransaction(); 
            getTransactions(); 
            return;
        }
        const voidRequest =
        { 
            OriginalTransaction:transaction.xRefNum, 
            IsCheck:transaction.xCommand.toLowerCase().includes("check")
        }
        await fetchWithAuth("void-transaction", voidRequest );
        getTransactions();
        setShowVoidConfirm(false);
        setShow(!show);
    }
    
    const RefundTransaction = async()=>
    {
        if(transaction.xCommand.includes("Wire"))
        {
            RefundWireTransaction(); 
            return;
        }
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

    const RefundWireTransaction = async()=> 
    {
        const amt = refundOption=="Partial"?partialAmount : transaction.xAmount
        const refundRequest = {
            amount: amt, 
            RefNum: transaction.xRefNum
        }
        await fetchWithAuth("refund-wire", refundRequest );
        setShowRefundConfirm(false);
        setShow(!show);

    }

    const VoidWireTransaction = async()=> 
    {
        const VoidRequest = {
            RefNum: transaction.xRefNum
        }
        await fetchWithAuth("void-wire", VoidRequest );
        setShowRefundConfirm(false);
        setShow(!show);
    }

    const ConfirmWireTransaction = async()=>{
        const ConfirmRequest = {
            RefNum : transaction.xRefNum
        }
        await fetchWithAuth("confirm-wire", ConfirmRequest);
        setShowConfirmWire(false);
        setShow(!show);
        getTransactions(); 
    }


    const NewTransaction =async () => 
    {
        try {
        const newTransactionRequest = {
            xToken: transaction.xToken, // Use saved token from original transaction
            xAmount: newTransactionAmount,
            xCommand: "cc:sale", // or "check:sale" based on transaction type
            // Include any other required fields from original transaction
            xInvoice: transaction.xInvoice,
            xCustom01: transaction.xCustom01, // Account/customer info
            xCustom02: transaction.xCustom02,
            xCustom03: transaction.xCustom03,
            xDescription: `New transaction using saved payment method`,
            // Surcharge calculation if needed
            xCustom09: 0, // Surcharge - recalculate if needed
            xCustom10: newTransactionAmount, // Subtotal
        };

        await fetchWithAuth("process-new-transaction", newTransactionRequest);
        
        setShowNewTransaction(false);
       
        // Optionally show success message or refresh transaction list
        
    } catch (error) {
        console.error("Failed to process new transaction:", error);
        // Show error message to user
    }
    }

    const buttonContent = <MoreVertical/>
    return <Dropdown classes={"transaction-action"} buttonContent={ buttonContent} buttonClasses = "trd-btn" show={show} >
       { showVoidConfirm && <ConfirmationModal onConfirm={VoidTransaction} onClose={()=>{setShowVoidConfirm(false); setShow(!show)}} confirmButtonText="Void" >
        <div className="all-padding-bottom">
            <h2>Void Transaction</h2>
            <span>Are you sure you want to void this transaction?</span>
            {transaction.xCommand.includes("Wire") && <span>
                    No money will actually be transferred or cancelled when voiding a wire transaction - this only confirms transaction status. 
                </span>}
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
            {transaction.xCommand.includes( "Wire")&& 
            <div> 
                No refund will actually be issued to customer for wire transactions - this only confirms refund in our system. 
            </div>
            }
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

       {
         showConfirmWire && <ConfirmationModal confirmButtonText={"Confirm"} onClose={()=>setShowConfirmWire(false)} onConfirm={ConfirmWireTransaction}>

             <h2>Confirm  Wire Transaction</h2>
            <span> Are you sure you want to confirm this transaction?</span>
        </ConfirmationModal>
       }

       {
        showNewTransaction && 
        <ConfirmationModal onConfirm={NewTransaction} confirmButtonText={"Process"} onClose={()=>{setShowNewTransaction(false)}}>
           // amount textbox 
            // surcharge bar if isCreditCard
            <div className="form-row">
                <div className="form-group percent-input-wrapper">
                        <label >
                        Transfer Fee: 
                    </label>
                    
                    <input
                        type="number"
                        name="transferFee"
                        min="0"
                        max="3.5"
                        step="0.01"
                        value={transferFee}
                        onChange={()=>setTransferFee(e.target.value)}
                        placeholder="0"
                    />
                    <span className="percent-sign">%</span>
                
                    </div>
                    
                <div className="form-group">
                        <label>&nbsp; </label>
                    <input
                        className="arrow-slider"
                        type="range"
                        id="transferFee"
                        name="transferFee"
                        min="0"
                        max="3.5"
                        step="0.01"
                        value={transferFee}
                        onChange={()=>setTransferFee(e.target.value)}
                    />
                    </div>
            </div>
           
           // total amount if is creditCard
           // create transaction 
        </ConfirmationModal>
       }



       <ul>
            <li onClick={()=>{setShowVoidConfirm(true)}}>
               <X style={{marginRight:"10px"}}/>  Void
            </li>
            <li onClick={()=>{setShowRefundConfirm(true)}}>
               <RotateCcw style={{marginRight:"10px"}}/> Refund
            </li>
            {
               transaction.xCommand.includes('Wire') && 
               <li onClick={()=>{setShowConfirmWire(true)}}>
                 <Check style={{marginRight:"10px"}}/> Confirm Wire
                </li>
            }

            {
               !transaction.xCommand.includes('Wire') &&  <li onClick={()=>{setShowNewTransaction(true)}}>
               <Plus style={{marginRight:"10px"}}/> New Transaction
            </li>
             }
        </ul>
   </Dropdown>
}