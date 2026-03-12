import { useState, useEffect } from "react";
import CustomerPolicies from "../Customer/CustomerPolicies";
//import { CustomerActionDropdown } from "./CustomerActionDropdown";

import { ReadOnlyCustomerInfo } from "../ReadOnlyCustomerInfo";
import { PaymentMethods } from "../PaymentMethods";
import Detail from "../Detail";
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
    const header = <div className="trd-tabs">
            <div className={`${activeTab == "Customer" ? 'active-tab' : ''} tab`} onClick={() => { setActiveTab("Customer") }}>
                Customer Info
            </div>
            <div className={`${activeTab == "PaymentMethods" ? 'active-tab' : ''} tab`} onClick={() => { setActiveTab("PaymentMethods") }} >
                Payment Methods
            </div>
            <div className={`${activeTab == "Policies" ? 'active-tab' : ''} tab`} onClick={() => { setActiveTab("Policies") }} >
                Policies
            </div>
        </div>

    const body = <>
        
        {/* Body */}
        <div >
            {/* Reference Info */}
            {activeTab == "Customer" &&
                <ReadOnlyCustomerInfo customerID={customer.CustomerId} />
            }
            {activeTab == "PaymentMethods" &&
                <PaymentMethods CustomerId={customer.CustomerId} defaultMethodId={customer.DefaultPaymentMethodId} />
            }
            {activeTab == "Policies" &&
                <CustomerPolicies customer={customer} customerId={customer.CustomerId} />
            }

        </div>
    </>
    return (
        customer && <Detail title={"Customer Details"} body={body} header={header} onClose={onClose}></Detail>
    )

    
}
