import { useEffect, useState } from "react";
import { Policy } from "../Objects/NewPolicy";
import { fetchWithAuth, FormatCurrency, Sort } from "../Utilities";
import { useSuccessModal } from "../Objects/SuccessModal";
import { PolicyDetail } from "../Objects/Details/PolicyDetail";
import { Grid } from '../Objects/Grid';


export default function Policies() {
   const [showNewPolicy, setShowNewPolicy] = useState(false);
   const [policy , setPolicy] = useState(null);
   const [data, setData] = useState([]);
  

   const [headers, setHeaders] = useState([
      
      {
         DisplayValue: "Policy Code",
         Show: true,
         Value: "PolicyCode",
         SortString: "PolicyCode",
         SortAsc: false
      },
      {
         DisplayValue: "Policy Description",
         Show: true,
         Value: "PolicyDescription",
         SortString: "PolicyDescription",
         SortAsc: false
      },

      {
        DisplayValue:"Policy Amount",
        Show: true,
        Value:  "PolicyAmountString",
        SortString : "PolicyAmount",
        SortAsc: true
          
      },

     
      {
        DisplayValue:"Commission Amount",
        Show: true,
        Value:  "CommissionAmountString",
        SortString : "CommissionAmount",
        SortAsc: true
          
      },
      {
        DisplayValue:"Payable To Carrier",
        Show: true,
        Value:  "PayableAmountString",
        SortString : "PayableAmount",
        SortAsc: true
          
      },
      
      {
        DisplayValue:"Carrier",
        Show: true,
        Value:  "CarrierName",
        SortString : "CarrierName",
        SortAsc: true
          
      },
      {
        DisplayValue:"Sub-broker",
        Show: true,
        Value:  "SubBrokerName",
        SortString : "SubBrokerName",
        FilterValue: "SubBrokerName",
        SortAsc: true
          
      },

      {
        DisplayValue:"Sub-broker Commission",
        Show: true,
        Value:  "SubBrokerAmountString",
        SortString : "SubBrokerAmount",
        FilterValue : "SubBrokerAmount", 
        SortAsc: true
          
      },


      {
        DisplayValue:"Policy Start",
        Show: true,
        Value:  "PolicyStartString",
        SortString : "PolicyStartDate",
        SortAsc: false
          
      },
       {
        DisplayValue:"Policy End",
        Show: true,
        Value:  "PolicyEndString",
        SortString : "PolicyEndDate",
        SortAsc: false
          
      },
     {
         DisplayValue: "Last Name",
         Show: true,
         Value: "BillLastName",
         SortString: "BillLastName",
         SortAsc: false
      },


       {
         DisplayValue:"Email", 
         Show: true, 
         Value:  "Email",
         SortString : "Email",
         SortAsc: true
       },


       {
         DisplayValue:"Company", 
         Show: true, 
         Value:  "BillCompany",
         SortString:"BillCompany",
         SortAsc: true
       },

          {
         DisplayValue:"Phone", 
         Show: true, 
         Value:  "Phone",
         SortString : "Phone", 
         SortAsc: true
       },

      //  // {
      //  //   DisplayValue:"Description", 
      //  //   Show: true, 
      //  //   Value:  "xDescription",
      //  //   SortAsc: true
      //  // },


      //  {
      //    DisplayValue:"Customer ID", 
      //    Show: false, 
      //    Value:  "xCustom01",
      //    SortString: "CardknoxCustomer",
      //    SortAsc: true
      //  },


      //  {
      //    DisplayValue:"CSR Code", 
      //    Show: false, 
      //    Value:  "xCustom02",
      //    SortString : "CsrCode",
      //    SortAsc: true
      //  },

    {
         DisplayValue: "Customer ID",
         Show: true,
         Value: "CustomerId",
         SortString: "CustomerId",
         SortAsc: true
      }

   ])

   const {showSuccess, SuccessModal}= useSuccessModal();

   async function getData() {
     

      const response = await fetchWithAuth("get-policy-list", {})
      
      const formattedData = response.map((policy) => {
           return  {
                ...policy.Customer,
                ...policy,  
                PolicyAmountString: FormatCurrency(policy.Amount),
                CommissionAmountString: FormatCurrency(policy.CommissionAmount),
                PayableAmountString: FormatCurrency(policy.Amount - policy.CommissionAmount),
                PolicyAmount: policy.Amount,
                PayableAmount: policy.Amount - policy.CommissionAmount,
                PolicyId: policy.Id, 
                SubBrokerAmountString : FormatCurrency(policy.SubbrokerAmount),
                PaidToCarrierString : FormatCurrency(policy.PaidToCarrier), 
                OwedAmountString: FormatCurrency(policy.Amount - policy.CommissionAmount- policy.PaidToCarrier),
                CustomerPaidString : FormatCurrency(policy.PaidByCustomer), 
                CustomerBalanceString : FormatCurrency(policy.Amount - policy.PaidByCustomer),
                CustomerBalance : policy.Amount - policy.PaidByCustomer, 
                OwedAmount:policy.Amount - policy.CommissionAmount- policy.PaidToCarrier

            }
      })

      setData(formattedData);

     
   }

   useEffect  (() => {
      getData();
   }, [])

  


   function sortData( field, ascending = true) {
       const sortedData = Sort (data, field, ascending)
       setData(sortedData);
      }

   function ShowSuccessfulNewPolicy() {
      setShowNewPolicy(false);
      showSuccess("Successfully created new policy"  )
      getData()
   }
   return <>
   { policy !== null && <PolicyDetail policy={policy} onClose={()=>{setPolicy(null); getData(); }}/>}
      <div className="header">
          <div className="header-actions">
              {/* <button className="btn btn-secondary">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Export
              </button> */}
              {/* <button className="btn btn-secondary">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                  </svg>
                  Print
              </button> */}
              <button className="btn-new-tx" type="button" onClick={()=> setShowNewPolicy(true)}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  New Policy
              </button>
          </div>
      </div>

      {
         showNewPolicy && <Policy Close={() => setShowNewPolicy(false)} OnSuccess={ShowSuccessfulNewPolicy} />

      }
      <Grid 
         enableFilters={false} 
         rowClick={setPolicy} 
         JsonObjectList={data} 
         headerList={headers} 
         SetHeaderList={setHeaders} 
         Sort={sortData} 
         />
      
      <SuccessModal/>
   </>
}
