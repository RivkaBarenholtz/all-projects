//import { useState, useEffect } from "react";
import {  FormatCurrency} from "../Utilities";
import { ScheduleActionDropdown } from "./ScheduleActionDropdown";

export const ReadOnlyScheduleInfo = ({ schedule, setSchedule})=> 
{
    
    
    return <>
     <div >
        <p className="id-label">schedule #:
            
        </p>
       <span style={{    color: "rgb(54, 101, 183)"}} className=" amount">{schedule.ScheduleId}</span>
                
     </div>
         <div className="trd-section">
                <h3 className="trd-section-title">Schedule Information</h3>
                <div className="trd-info-grid">
                  <div className="trd-info-row">
                    <span className="trd-label">Amount:</span>
                    <span className="trd-value">{FormatCurrency(schedule.Amount)}</span>
                  </div>
                  <div className="trd-info-row">
                    <span className="trd-label">Payment Method:</span>
                    <span className="trd-value">{schedule.PaymentMethod?.MaskedCardNumber}</span>
                  </div>
                  <div className="trd-info-row">
                    <span className="trd-label">Description:</span>
                    <span className="trd-value">{schedule.Description}</span>
                  </div>
                 <div className="trd-info-row">
                        <span className="trd-label">Invoice:</span>
                        <span className="trd-value">{schedule.Invoice}</span>
                    </div>
                 <div className="trd-info-row">
                        <span className="trd-label">Last Transaction Status:</span>
                        <span className="trd-value">{schedule.LastTransactionStatus}</span>
                    </div>
                 <div className="trd-info-row">
                        <span className="trd-label">Created On:</span>
                        <span className="trd-value">{schedule.CreatedDate?.split(" ")[0]}</span>
                    </div>
                 <div className="trd-info-row">
                        <span className="trd-label">Last Run On:</span>
                        <span className="trd-value">{schedule.LastRunTime?.split(" ")[0]}</span>
                    </div>
                 <div className="trd-info-row">
                        <span className="trd-label">Next Run Time:</span>
                        <span className="trd-value">{schedule.NextScheduledRunTime=="0001-01-01T00:00:00"?"": schedule.NextScheduledRunTime}</span>
                    </div>
                    <div className="trd-info-row">
                        <span className="trd-label">Frequency:</span>
                        <span className="trd-value"> {`Every ${schedule.IntervalCount} ${schedule.IntervalType}`}</span>
                    </div>
                     <div className="trd-info-row">
                        <span className="trd-label">Start:</span>
                        <span className="trd-value">{schedule.StartDate?.split(" ")[0]}</span>
                    </div>
                   <div className="trd-info-row">
                        <span className="trd-label">End:</span>
                        <span className="trd-value">{schedule.EndDate??(schedule.TotalPayments?`After ${schedule.TotalPayments} payments`: "Continue Indefinitely")}</span>
                    </div>
                   
                  <ScheduleActionDropdown schedule={schedule} setSchedule={setSchedule}/>
                </div>
              </div>

     </>

}