import { useEffect, useState } from "react";
import NewSchedule from "./NewSchedule";
import { fetchWithAuth, FormatCurrency, Sort } from "./Utilities";
import { useSuccessModal } from "./Objects/SuccessModal";
import { Grid } from './Objects/Grid';
import { ScheduleDetail } from "./Objects/ScheduleDetail";

export default function Schedules() {
   const [showNewSchedule, setShowNewSchedule] = useState(false);
   const [schedule , setSchedule] = useState(null);
   const [nextToken, setNextToken] = useState("");
   const [data, setData] = useState([]);



   const [headers, setHeaders] = useState([
      {
         DisplayValue: "Schedule ID",
         Show: true,
         Value: "ScheduleId",
         SortString: "ScheduleId",
         SortAsc: true
      },
      {
         DisplayValue: "First Name",
         Show: true,
         Value: "BillFirstName",
         SortString: "BillLastName",
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
         DisplayValue: "Amount",
         Show: true,
         Value: "amtFormatted",
         SortString: "Amount",
         SortAsc: true
      },


       {
         DisplayValue:"Created By", 
         Show: false, 
         Value:  "CreatedBy",
         SortString: "CreatedBy",
         SortAsc: true
       },


       {
         DisplayValue:"Customer ID", 
         Show: true, 
         Value:  "CustomerId",
         SortString : "CustomerId",
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
         DisplayValue:"Total Payments", 
         Show: true, 
         Value:  "TotalPayments",
         SortString : "TotalPayments",
         SortAsc: true
       }
,
       
       {
         DisplayValue:"Payments Processed", 
         Show: true, 
         Value:  "PaymentsProcessed",
         SortString : "PaymentsProcessed",
         SortAsc: true
       }
,
       
       {
         DisplayValue:"Remaining Payments", 
         Show: true, 
         Value:  "RemainingPayments",
         SortString : "RemainingPayments",
         SortAsc: true
       }
,
       {
         DisplayValue:"Status", 
         Show: true, 
         Value:  "Status",
         SortString: "IsActive",
         SortAsc: true
       },

      //  {
      //    DisplayValue:"Status", 
      //    Show: true, 
      //    Value:  "StatusHtml",
      //    SortString : "Status", 
      //    SortAsc: true
      //  },

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


      //  {
      //    DisplayValue:"CSR Email", 
      //    Show: false, 
      //    Value:  "xCustom03",
      //    SortString : "CsrEmail",
      //    SortAsc: true
      //  }

   ])

   const {showSuccess, SuccessModal}= useSuccessModal();

   async function getData() {
      const req = {
         NextToken: nextToken,
         PageSize: 10
      }

      const response = await fetchWithAuth("list-schedules", req)
      
      const formattedData = response.Schedules.map((schedule) => {
         return {
            ...schedule,
            amtFormatted: <span className='amount positive'>{FormatCurrency(schedule.Amount)}</span>,
            Status: <span className={`status ${schedule.IsActive?"approved":"chargeback"}`}>{schedule.IsActive? "Active":"Stopped"} </span>,
            RemainingPayments: Number(schedule.TotalPayments )- Number(schedule.PaymentsProcessed)
         }

      })

      const allData =[
         ...nextToken == '' || nextToken == undefined ? [] : data,
         ...formattedData
      ]
      setNextToken(response.NextToken)
         setData(allData)
      
   }

   useEffect(() => {

    
      getData()


   }

      , [])

   function sortData( field, ascending = true) {
       const sortedData = Sort (data, field, ascending)
       setData(sortedData);
      }

   function ShowSuccessfulNewSchedule() {
      setShowNewSchedule(false);
      showSuccess("Successfully created new schedule"  )
   }
   return <>
   { schedule !== null && <ScheduleDetail scheduleParam={schedule} scheduleId={schedule.ScheduleId} onClose={()=>{setSchedule(null); getData(); }}/>}
      <div className="header">
          <h2>Schedules</h2>
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
              <button className="btn btn-primary" type="button" onClick={()=> setShowNewSchedule(true)}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  New Schedule
              </button>
          </div>
      </div>

      {
         showNewSchedule && <NewSchedule CloseNewSchedule={() => setShowNewSchedule(false)} OnSuccess={ShowSuccessfulNewSchedule} />


      }
      <Grid rowClick={setSchedule} JsonObjectList={data} headerList={headers} SetHeaderList={setHeaders} Sort={sortData} footerObjects={<a className = "view-more" onClick={getData}> View More  </a>}/>
      
      <SuccessModal/>
   </>
}