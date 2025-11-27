import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWithAuth } from "../Utilities";

import { X, MoreVertical  } from "lucide-react";
import { ScheduleActionDropdown } from "./ScheduleActionDropdown";

import { ReadOnlyCustomerInfo } from "./ReadOnlyCustomerInfo";
import { ReadOnlyScheduleInfo } from "./ReadOnlyScheduleInfo";
export  function ScheduleDetail({ scheduleId, scheduleParam,  onClose }) {
  const [activeTab, setActiveTab]= useState("Customer")
  const [schedule, setSchedule]= useState({})

 const getSchedule = async()=> 
  {
      const s= await  fetchWithAuth("get-schedule", {ScheduleId : scheduleId})
      setSchedule({...s, ...scheduleParam}) ;
  }
  useEffect(()=> {
         
          if (scheduleId !== undefined && scheduleId !== "")
            getSchedule();
  
      }, [scheduleId])
  return (
    <AnimatePresence>
      {schedule && (
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
              <h2>Schedule Details</h2>
              <div style={{display:"flex" , alignItems:"center"}}>
                 <div className="dropdown-container">
               
                    <ScheduleActionDropdown schedule={schedule} setSchedule={getSchedule}/>
              
              </div>
              <div >
               <button onClick={onClose} type='button' className="trd-btn close">
                    <X/>
                </button>
              </div>
              </div>
             
            </div>
            <div className="trd-tabs">
                <div className={`${activeTab=="Schedule"?'active-tab':''} tab`} onClick={()=> {setActiveTab("Schedule")}}>
                    Schedule Info
                </div>
                <div className={`${activeTab=="Customer"?'active-tab':''} tab`}  onClick={()=> {setActiveTab("Customer")}} >
                    Customer Info
                </div>
            </div>
            {/* Body */}
            <div className="trd-body">
              {/* Reference Info */}
             { activeTab=="Schedule" &&
               <ReadOnlyScheduleInfo schedule={schedule}/>
             }
              { activeTab=="Customer" &&
               <ReadOnlyCustomerInfo customerID={schedule.CustomerId}/>
             }
             
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
