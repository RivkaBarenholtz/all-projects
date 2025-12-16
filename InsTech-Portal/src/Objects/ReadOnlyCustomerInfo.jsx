import { useState, useEffect } from "react";
import { fetchWithAuth } from "../Utilities";

export const ReadOnlyCustomerInfo = ({customerID,  setCustomerObj})=> 
{
    const [customer, setCustomer ] = useState({}); 

    useEffect(()=> {
        const getCustomer = async()=> 
        {
            const cust= await  fetchWithAuth("get-cardknox-customers", {CustomerId : customerID})
            setCustomer(cust.Customers[0]) ;
            setCustomerObj && setCustomerObj(cust.Customers[0])
        }
        if (customerID != null && customerID!= "")
          getCustomer();

    }, [customerID])
    return <>
     <div >
        <p className="id-label">cust #:
            
        </p>
        <div style={{color: "rgb(54, 101, 183)"}} className=" amount">{customerID}</div>        
     </div>

             <div className="trd-section">
                <h3 className="trd-section-title">Customer Information</h3>
                <div className="trd-info-grid">
                  <div className="trd-info-row">
                    <span className="trd-label">Customer #:</span>
                    <span className="trd-value">{customer.CustomerNumber}</span>
                  </div>
                  <div className="trd-info-row">
                    <span className="trd-label">Email:</span>
                    <span className="trd-value">{customer.Email}</span>
                  </div>
                  <div className="trd-info-row">
                    <span className="trd-label">Note:</span>
                    <span className="trd-value">{customer.Note}</span>
                  </div>
                 
                </div>
              </div>

              {/* Billing Info */}
              <div className="trd-section">
                <h3 className="trd-section-title">Billing Information</h3>
                <div className="trd-info-grid">
                    <div className="trd-info-row">
                        <span className="trd-label">First Name:</span>
                        <span className="trd-value">{customer.BillFirstName}</span>
                    </div>
                    <div className="trd-info-row">
                        <span className="trd-label">Last Name:</span>
                        <span className="trd-value">{customer.BillLastName}</span>
                    </div>
                     <div className="trd-info-row">
                        <span className="trd-label">Company:</span>
                        <span className="trd-value">{customer.BillCompany}</span>
                    </div>
                   <div className="trd-info-row">
                        <span className="trd-label">Address:</span>
                        <span className="trd-value">{customer.BillStreet}</span>
                    </div>
                   <div className="trd-info-row">
                        <span className="trd-label">Address Line 2:</span>
                        <span className="trd-value">{customer.BillStreet2}</span>
                    </div>
                  
                   <div className="trd-info-row">
                        <span className="trd-label">City, State:</span>
                        <span className="trd-value">{customer.BillCity} , {customer.BillState} { customer.Zip}</span>
                    </div>
                  <div className="trd-info-row">
                        <span className="trd-label">Phone:</span>
                        <span className="trd-value">{customer.BillPhone}</span>
                    </div>
                  
                </div>
              </div>
              </>

}