import { motion, AnimatePresence } from "framer-motion";
import { FormatCurrency } from "../Utilities";
import { X, MoreVertical  } from "lucide-react";
import { TransactionActionDropdown } from "./TransactionActionDropdown";
export default function TransactionDetail({ transaction, onClose , getTransactions}) {
  return (
    <AnimatePresence>
      {transaction && (
        <div className="trd-overlay-container">
          {/* Dark overlay */}
          <motion.div
            className="trd-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Side Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="trd-drawer"
          >
            {/* Header */}
            <div className="trd-header">
              <h2>Transaction Details</h2>
              <div >
               
                <button onClick={onClose} type='button' className="trd-btn close">
                    <X/>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="trd-body">
              {/* Reference Info */}
              <div className="trd-section">
                <p className="trd-label">Ref #</p>
                <p className="trd-transaction-id">{transaction.xRefNum}</p>
                <div className="trd-statuses">
                    {transaction.StatusHtml}
               
                </div>
              </div>

              {/* Status */}
              

              {/* General Info */}
              <div className="trd-section">
                <h3 className="trd-section-title">General Information</h3>
                <div className="trd-info-grid">
                  <div className="trd-info-row">
                    
                    <span className="amount trd-transaction-id">{transaction.xCustom10 == 0 || transaction.xCustom10 == null?FormatCurrency(transaction.xAmount): FormatCurrency(transaction.xCustom10) }</span>
                  </div>
                  <div className="trd-info-row">
                    <span className="trd-label">Transaction Type:</span>
                    <span className="trd-value">{transaction.xCommand.split(":").length==2? transaction.xCommand.split(":")[1]:transaction.xCommand}</span>
                  </div>
                  <div className="trd-info-row">
                    <span className="trd-label">Payment Type:</span>
                    <span className="trd-value">{transaction.xCommand.split(":")[0]}</span>
                  </div>
                  <div className="trd-info-row">
                    <span className="trd-label">Entered Date:</span>
                    <span className="trd-value">{transaction.xEnteredDate}</span>
                  </div>
                  {
                    transaction.xInvoice  && transaction.xInvoice != "" && 
                    <div className="trd-info-row">
                        <span className="trd-label">Invoice:</span>
                        <span className="trd-value">{transaction.xInvoice}</span>
                    </div>
                  }
                  <div className="trd-info-row">
                    <span className="trd-label">Account #:</span>
                    <span className="trd-value"> {transaction.xMaskedAccountNumber}</span>
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              <div className="trd-section">
                <h3 className="trd-section-title">Billing Information</h3>
                <div className="trd-info-grid">
                  {
                    transaction.xName  && transaction.xName != "" && 
                    <div className="trd-info-row">
                        <span className="trd-label">Cardholder Name:</span>
                        <span className="trd-value">{transaction.xName}</span>
                    </div>
                  }
                  {
                    transaction.xBillLastName  && transaction.xBillLastName != "" && 
                    <div className="trd-info-row">
                        <span className="trd-label">Account Code:</span>
                        <span className="trd-value">{transaction.xBillLastName}</span>
                    </div>
                  }
 
                  {
                    transaction.xStreet  && transaction.xStreet != "" && 
                    <div className="trd-info-row">
                        <span className="trd-label">Address:</span>
                        <span className="trd-value">{transaction.xStreet}</span>
                    </div>
                  }
                  {
                    ((transaction.xBillCity  && transaction.xBillCity != "")
                    || (transaction.xBillState  && transaction.xBillState != "")
                    || (transaction.xZip  && transaction.xZip != "")
                    ) && 
                    <div className="trd-info-row">
                        <span className="trd-label">City, State:</span>
                        <span className="trd-value">{transaction.xBillCity} , {transaction.xBillState} { transaction.xZip}</span>
                    </div>
                  }
                  {
                    transaction.xBillPhone  && transaction.xBillPhone != "" && 
                    <div className="trd-info-row">
                        <span className="trd-label">Phone:</span>
                        <span className="trd-value">{transaction.xBillPhone}</span>
                    </div>
                  }
                  {
                    transaction.xEmail  && transaction.xEmail != "" && 
                    <div className="trd-info-row">
                        <span className="trd-label">Email:</span>
                        <span className="trd-value">{transaction.xEmail}</span>
                    </div>
                  }
                </div>
                <TransactionActionDropdown getTransactions={()=>{getTransactions(); onClose();  }} transaction={transaction} />
              </div>

             
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
