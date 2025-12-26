import {  useState } from "react";
import { Dropdown } from "./Dropdown";
import { MoreVertical, X, CheckCheck, Trash2 } from "lucide-react";
import { ConfirmationModal } from "./ConfimationModal";
import { FormatCurrency, fetchWithAuth } from "../Utilities";

import { useAsync } from "react-select/async";

export const ScheduleActionDropdown =({schedule, setSchedule})=> 
{
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEnableConfirm, setShowEnableConfirm] = useState(false);

    const [show, setShow] = useState(true);

    const DeleteSchedule = async()=> 
    {
        const DeleteRequest =
        { 
            ScheduleId:schedule.ScheduleId, 
        }
        await fetchWithAuth("delete-schedule", DeleteRequest );
        setShowDeleteConfirm(false);
        await setSchedule(); 
        setShow(!show);
    }
    
    const StopSchedule = async()=>
    {
        let StopRequest  = 
        { 
            ScheduleId:schedule.ScheduleId, 
        }
        const response=  await fetchWithAuth("disable-schedule", StopRequest );
        await setSchedule();
        setShowStopConfirm(false);
        setShow(!show);

    }

    const EnableSchedule = async()=>
    {
        let StopRequest  = 
        { 
            ScheduleId:schedule.ScheduleId, 
        }
        await fetchWithAuth("enable-schedule", StopRequest );
        setShowEnableConfirm(false);
        await setSchedule(); 
        setShow(!show);

    }

   
    return <>
       { showStopConfirm && <ConfirmationModal onConfirm={StopSchedule} onClose={()=>{setShowStopConfirm(false); setShow(!show)}} confirmButtonText="Stop Schedule" >
        <div className="all-padding-bottom">
            <h2>Stop Schedule</h2>
            <span>Are you sure you want to stop this schedule?</span>
            <div>
                <div className="trd-info-row">
                    <span className="amount trd-transaction-id">{schedule.ScheduleId}</span>
                </div>
                
            </div>
        </div>
       </ConfirmationModal>  }
       { showEnableConfirm && <ConfirmationModal onConfirm={EnableSchedule} onClose={()=>{setShowEnableConfirm(false)} }  confirmButtonText="Enable Schedule">
            
        <div className="all-padding-bottom">
            <h2>Enable Schedule</h2>
            <span>Are you sure you want to enable this schedule?</span>
            <div>
                <div className="trd-info-row">
                    <span className="amount trd-transaction-id">{schedule.ScheduleId}</span>
                </div>
                
            </div>

                 
        </div>

       </ConfirmationModal>  }

        { showDeleteConfirm && <ConfirmationModal onConfirm={DeleteSchedule} onClose={()=>{setShowDeleteConfirm(false)} }  confirmButtonText="Delete Schedule">
            
        <div className="all-padding-bottom">
            <h2>Delete Schedule</h2>
            <span>Are you sure you want to stop this schedule?</span>
            <div>
                <div className="trd-info-row">
                    <span className="amount trd-transaction-id">{schedule.ScheduleId}</span>
                </div>
                
            </div>

                 
        </div>

       </ConfirmationModal>  }

       <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexDirection: 'column',
            gap: '10px'
        }}>
            { !schedule.IsActive && <>
           <button style={{justifyContent:"center", padding: ".25rem" }} className="btn btn-secondary"  onClick={()=>{setShowEnableConfirm(true)}}>
               <CheckCheck style={{marginRight:"10px"}}/>  Enable Schedule
            </button>
           <button style={{justifyContent:"center", padding: ".25rem" }} className="btn btn-secondary"  onClick={()=>{setShowDeleteConfirm(true)}}>
               <Trash2 style={{marginRight:"10px"}}/> Delete Schedule
            </button>
            </>
        }
         { schedule.IsActive && <>
           <button style={{justifyContent:"center", padding: ".25rem" }} className="btn btn-secondary"  onClick={()=>{setShowStopConfirm(true)}}>
               <X style={{marginRight:"10px"}}/>  
               Stop Schedule
            </button>
            </>
         }
            
        </div>
   </>
}