import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchWithAuth } from "../Utilities";

import { X, MoreVertical } from "lucide-react";

import { ScheduleActionDropdown } from "./ScheduleActionDropdown";

import { ReadOnlyCustomerInfo } from "./ReadOnlyCustomerInfo";
import { ReadOnlyScheduleInfo } from "./ReadOnlyScheduleInfo";
import { EditSchedule } from "./EditSchedule";
import { NewCustomer } from "./NewCustomer";
export function ScheduleDetail({ scheduleId, scheduleParam, onClose }) {
  const [activeTab, setActiveTab] = useState("Customer")
  const [schedule, setSchedule] = useState({})
  const [isEditMode, setIsEditMode] = useState(false)

  const [customer, setCustomer] = useState({});

  const customerRef = useRef();

  const getSchedule = async () => {
    const s = await fetchWithAuth("get-schedule", { ScheduleId: scheduleId })
    setSchedule({ ...scheduleParam, ...s });
  }
  useEffect(() => {

    if (scheduleId !== undefined && scheduleId !== "")
      getSchedule();

  }, [scheduleId])

  useEffect (()=> {
   const data = {
    scheduleName: schedule.ScheduleName,
    description: schedule.Description,
    amount: schedule.Custom10?? schedule.Amount,
    totalAmount: schedule.Amount,
    electronicFee: schedule.Custom09,
    includeFee: schedule.Custom09 > 0,
    invoice: schedule.InvoiceNumber,
    frequency: schedule.IntervalType,
    frequencyNum: schedule.IntervalCount, 
    runSpecificDay: schedule.RunSpecificDay,
    skipDays: schedule.SkipSaturdayAndHolidays,
    calendarType: schedule.CalendarCulture,
    startDate: schedule.StartDate,
    endDate:schedule.EndDate,
    endOption: (schedule.EndDate?"Date": schedule.TotalPayments > 0 ? "NumberOfPayments": "Never"),
    numberOfPayments: schedule.TotalPayments,
    sendReceipt: schedule.CustReceipt,
    retryDefaultCard: schedule.UseDefaultPaymentMethodOnly,
    createOnFail: false,
    retryEnabled: schedule.FailedTransactionRetryTimes > 0 ,
    retryAttempts: schedule.FailedTransactionRetryTimes,
    retryDays: schedule.DaysBetweenRetries,
    afterFail: schedule.AfterMaxRetriesAction,
    custom1: schedule.Custom01,
    custom2: schedule.Custom02,
    transferFee :schedule.Custom09/ schedule.Custom10,
    isCheck:schedule.PaymentMethod?.TokenType != "CC" 
  }
  setFormData(data);
  }, [schedule] )

  const SaveChanges = () => {
    if (!isEditMode) return;
    if (activeTab == "Customer")
      customerRef.current.submit();
    else

      // save schedule
      fetchWithAuth("update-schedule", { ...GetNewSchedule() })
        .then((result) => {
          // optional: inspect result for success/failure depending on API shape
          setIsEditMode(false);
          getSchedule();
        })
        .catch((err) => {
          console.error("Failed to save schedule", err);
          alert("Failed to save schedule. See console for details.");
        });




  }

  const [formData, setFormData] = useState({});
    const handleScheduleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
        });
    };

   const GetNewSchedule = () => 
    {
        let  NewSchedule = {
            Amount : formData.includeFee && !formData.isCheck ? Number(formData.amount) + (formData.amount * formData.transferFee/100).toFixed(2) : formData.amount, 
            Description:formData.description, 
            Invoice:formData.invoice , 
            ScheduleName: formData.scheduleName, 
            IntervalCount:formData.frequencyNum, 
            FailedTransactionRetryTimes: formData.retryAttempts, 
            DaysBetweenRetries: formData.retryDays,
            SkipSaturdayAndHolidays:formData.skipDays,
            StartDate: new Date(schedule.StartDate).toLocaleDateString("en-CA"), 
            ScheduleId: schedule.ScheduleId, 
            Revision: schedule.Revision, 
            AfterMaxRetriesAction: formData.afterFail, 
            CalendarCulture : formData.calendarType
        }
        if (formData.endOption == "NumberOfPayments")
        {
            NewSchedule = {
                ...NewSchedule, 
                TotalPayments: formData.numberOfPayments
            }
        }
        if (formData.endOption == "Date")
        {
            NewSchedule = {
                ...NewSchedule, 
                EndDate: formData.endDate
            }
        }

        return NewSchedule; 


    }
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
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{display:"flex"}}>

                  <button
                    title={isEditMode? "Save changes" : activeTab=="Schedule" && !schedule.IsActive? "Cannot edit inactive schedule": "Edit"}
                    disabled = {(activeTab=="Schedule" && !schedule.IsActive) }
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      marginRight: "10px",
                      border: 'none',
                      cursor: 'pointer',
                      color : (activeTab=="Schedule" && !schedule.IsActive? "Gray": "Black"),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',

                    }}
                    onClick={() => { setIsEditMode(!isEditMode); SaveChanges() }}
                  >
                    {isEditMode ? "✔" : "✎"}
                  </button>


                  {
                    isEditMode && <button
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        marginRight: "10px",
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',

                      }}
                      onClick={() => { setIsEditMode(false) }}
                      title="Cancel changes"
                    >
                      ↩
                    </button>
                  }

                  {/* // <ScheduleActionDropdown schedule={schedule} setSchedule={getSchedule}/> */}

                </div>
                <div >
                  <button onClick={onClose} type='button' className="trd-btn close">
                    <X />
                  </button>
                </div>
              </div>

            </div>
            <div className="trd-tabs">
              <div className={`${activeTab == "Schedule" ? 'active-tab' : ''} tab`} onClick={() => { setActiveTab("Schedule"); setIsEditMode(false) }}>
                Schedule Info
              </div>
              <div className={`${activeTab == "Customer" ? 'active-tab' : ''} tab`} onClick={() => { setActiveTab("Customer"); setIsEditMode(false) }} >
                Customer Info
              </div>
            </div>
            {/* Body */}
            <div className="trd-body">
              {/* Reference Info */}
              {activeTab == "Schedule" &&
                <> {
                  isEditMode ? (<EditSchedule formData={formData} handleScheduleChange={handleScheduleChange} />) : (<ReadOnlyScheduleInfo setSchedule={getSchedule} schedule={schedule} />)
                }

                </>
              }
              {activeTab === "Customer" && (
                isEditMode ? (
                  <NewCustomer
                    ref={customerRef}
                    customer={customer}
                    isEdit={true}
                    customerID={schedule.CustomerId}
                    OnSuccess={() => setIsEditMode(false)}
                  />
                ) : (
                  <ReadOnlyCustomerInfo
                    setCustomerObj={setCustomer}
                    customerID={schedule.CustomerId}
                  />
                )
              )}


            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
