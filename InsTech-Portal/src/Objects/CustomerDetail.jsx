import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWithAuth } from "../Utilities";

import { X, MoreVertical } from "lucide-react";
//import { CustomerActionDropdown } from "./CustomerActionDropdown";

import { ReadOnlyCustomerInfo } from "./ReadOnlyCustomerInfo";
import { PaymentMethods } from "./PaymentMethods";
export function CustomerDetail({ customer, onClose }) {
    const [activeTab, setActiveTab] = useState("Customer")
   // const [customer, setCustomer] = useState({})

    // const getCustomer = async () => {
    //     const s = await fetchWithAuth("get-customer", { CustomerId: customerId })
    //     setCustomer(s);
    // }
    // useEffect(() => {

    //     if (customerId !== undefined && customerId !== "")
    //         getCustomer();

    // }, [customerId])
    return (
        <AnimatePresence>
            {customer && (
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
                            <h2>Customer Details</h2>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                {/* <div className="dropdown-container">

                                    <CustomerActionDropdown customer={customer} setCustomer={getCustomer} />

                                </div> */}
                                <div >
                                    <button onClick={onClose} type='button' className="trd-btn close">
                                        <X />
                                    </button>
                                </div>
                            </div>

                        </div>
                        <div className="trd-tabs">
                            <div className={`${activeTab == "Customer" ? 'active-tab' : ''} tab`} onClick={() => { setActiveTab("Customer") }}>
                                Customer Info
                            </div>
                            <div className={`${activeTab == "PaymentMethods" ? 'active-tab' : ''} tab`} onClick={() => { setActiveTab("PaymentMethods") }} >
                               Payment Methods
                            </div>
                        </div>
                        {/* Body */}
                        <div className="trd-body">
                            {/* Reference Info */}
                            {activeTab == "Customer" &&
                                <ReadOnlyCustomerInfo customerID={customer.CustomerId} />
                            }
                            {activeTab == "PaymentMethods" &&
                                <PaymentMethods CustomerId={customer.CustomerId} defaultMethodId={customer.DefaultPaymentMethodId} />
                            }

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
