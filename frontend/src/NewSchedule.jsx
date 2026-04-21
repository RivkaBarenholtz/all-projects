import { useEffect, useState } from "react";
import { CreditCardInfo } from "./Objects/CreditcardInfo";
import { CheckingInfo } from "./Objects/CheckingInfo";
import PaymentTabs from "./PaymentPage/PaymentTabs";
import { CustomerInfo } from "./Objects/CustomerInfo";
import { SchedulingInfo } from "./Objects/SchedulingInfo";
import { fetchWithAuth, FormatCurrency } from "./Utilities";
import { CalendarClock, CheckCircle, ChevronRight, CreditCard, DollarSign, Settings, User, X } from "lucide-react";

const STEPS = [
  { id: 1, name: "Client Details" },
  { id: 2, name: "Payment Info" },
  { id: 3, name: "Schedule Details" },
  { id: 4, name: "Review & Finalize" },
];

export default function NewSchedule({ CloseNewSchedule, OnSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");

  // Schedule info
  const [formData, setFormData] = useState({
    scheduleName: "",
    description: "",
    amount: 0,
    totalAmount: 0,
    electronicFee: "",
    includeFee: true,
    invoice: "",
    frequency: "month",
    frequencyNum: 1,
    runSpecificDay: false,
    skipDays: false,
    calendarType: "Gregorian",
    startDate: "",
    endDate: "",
    endOption: "Never",
    numberOfPayments: "",
    sendReceipt: false,
    retryDefaultCard: false,
    createOnFail: false,
    retryEnabled: false,
    retryAttempts: 5,
    retryDays: 1,
    afterFail: "ContinueNextInterval",
    custom1: "",
    custom2: "",
    transferFee: 3.5,
    isCheck: false,
  });

  const handleScheduleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  // Checking info
  const [accountType, setAccountType] = useState("Checking");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  // Customer info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [note, setNote] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Payment info
  const [activeTab, setActiveTab] = useState("Credit Card");
  const [cardToken, setCardToken] = useState("");
  const [cvvToken, setCvvToken] = useState("");
  const [ccValid, setCcValid] = useState(true);
  const [cvvValid, setCvvValid] = useState(true);
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");

  // General
  const [submitPressed, setSubmitPressed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, isCheck: activeTab === "eCheck" }));
  }, [activeTab]);

  const nextStep = () => {
    setStepError("");
    if (currentStep === 1) {
      if (!firstName || !lastName || !company) {
        setStepError("First name, last name, and company are required.");
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.isCheck && (!expMonth || !expYear || !cardToken)) {
        setStepError("Please complete all card details.");
        return;
      }
      if (formData.isCheck && (!accountName || !accountNumber || !routingNumber)) {
        setStepError("Please complete all account details.");
        return;
      }
      if (Number(formData.amount) <= 0) {
        setStepError("Amount must be greater than 0.");
        return;
      }
    }
    if (currentStep === 3) {
      if (Number(formData.frequencyNum) <= 0) {
        setStepError("Frequency must be greater than 0.");
        return;
      }
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const prevStep = () => {
    setStepError("");
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const CreateSchedule = async () => {
    const NewCustomer = {
      CustomerNumber: customerNumber,
      CustomerNotes: note,
      Email: email,
      BillFirstName: firstName,
      BillLastName: lastName,
      BillCompany: company,
      BillStreet: street,
      BillCity: city,
      BillState: state,
      BillZip: zip,
    };
    const NewPaymentMethod = { TokenType: formData.isCheck ? "Check" : "CC" };

    let payload = {
      NewCustomer,
      NewPaymentMethod,
      IntervalType: formData.frequency,
      Amount:
        formData.includeFee && !formData.isCheck
          ? Number(formData.amount) + Number((formData.amount * formData.transferFee / 100).toFixed(2))
          : formData.amount,
      Description: formData.description,
      Invoice: formData.invoice,
      ScheduleName: formData.scheduleName,
      IntervalCount: formData.frequencyNum,
      FailedTransactionRetryTimes: formData.retryAttempts,
      DaysBetweenRetries: formData.retryDays,
      SkipSaturdayAndHolidays: formData.skipDays,
      StartDate: formData.startDate,
      AfterMaxRetriesAction: formData.afterFail,
    };

    if (formData.endOption === "NumberOfPayments")
      payload = { ...payload, TotalPayments: formData.numberOfPayments };
    if (formData.endOption === "Date")
      payload = { ...payload, EndDate: formData.endDate };

    let resp;
    setLoading(true);
    try {
      if (activeTab === "Credit Card") {
        payload = { ...payload, xCardNum: cardToken, xCvv: cvvToken, xExp: `${expMonth.value}${expYear.value}` };
        resp = await fetchWithAuth("create-new-schedule-cc", payload);
      } else {
        payload = { ...payload, xAccount: accountNumber, xRouting: routingNumber, xName: accountName };
        resp = await fetchWithAuth("create-new-schedule-check", payload);
      }
    } finally {
      setLoading(false);
    }

    if (resp?.Error) {
      setStepError(`Request failed: ${resp.Error}`);
      return;
    }

    OnSuccess();
  };

  const tabs = {
    "Credit Card": (
      <CreditCardInfo
        setCvvToken={setCvvToken}
        setCardToken={setCardToken}
        ccValid={ccValid}
        setCcValid={setCcValid}
        cvvValid={cvvValid}
        setCvvValid={setCvvValid}
        expMonth={expMonth}
        setExpMonth={setExpMonth}
        expYear={expYear}
        setExpYear={setExpYear}
        submitPressed={submitPressed}
      />
    ),
    eCheck: (
      <CheckingInfo
        accountName={accountName}
        setAccountName={setAccountName}
        accountNumber={accountNumber}
        setAccountNumber={setAccountNumber}
        accountType={accountType}
        setAccountType={setAccountType}
        routingNumber={routingNumber}
        setRoutingNumber={setRoutingNumber}
        submitPressed={submitPressed}
      />
    ),
  };

  // Review calculations
  const baseAmount = Number(formData.amount) || 0;
  const fee =
    formData.includeFee && !formData.isCheck
      ? Number((baseAmount * formData.transferFee / 100).toFixed(2))
      : 0;
  const total = baseAmount + fee;
  const freqLabel = { day: "Day(s)", week: "Week(s)", month: "Month(s)", year: "Year(s)" }[formData.frequency] || formData.frequency;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.5)",
      display: "flex", justifyContent: "center", alignItems: "center",
      padding: "24px",
    }}>
      <div style={{
        width: "100%", maxWidth: "670px",
        background: "white", borderRadius: "12px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        display: "flex", maxHeight: "90vh",
        position: "relative", overflow: "hidden",
      }}>
        {loading && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 20,
            background: "rgba(255,255,255,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "12px",
          }}>
            <div className="spinner" />
          </div>
        )}
        {/* Close button */}
        <button
          type="button"
          onClick={CloseNewSchedule}
          style={{
            position: "absolute", top: "12px", right: "12px", zIndex: 10,
            background: "#f3f4f6", border: "none", borderRadius: "50%",
            width: "32px", height: "32px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#6b7280",
          }}
        >
          <X size={16} />
        </button>

        {/* Sidebar */}
        <div style={{
          width: "200px", flexShrink: 0,
          background: "#f9fafb", borderRight: "1px solid #e5e7eb",
          padding: "24px 20px",
        }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600, color: "#111827" }}>
            Create Schedule
          </h2>
         
          <div style={{ position: "relative", marginTop: "35px" }}>
            {/* Track line */}
            <div style={{
              position: "absolute", left: "15px", top: "16px", bottom: "16px",
              width: "2px", background: "#e5e7eb",
            }} />
            {/* Progress line */}
            <div style={{
              position: "absolute", left: "15px", top: "16px",
              width: "2px",
              height: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
              background: "#043969",
              transition: "height 0.4s ease",
            }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {STEPS.map((step) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                return (
                  <div
                    key={step.id}
                    onClick={() => { if (isCompleted) { setCurrentStep(step.id); setStepError(""); } }}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      position: "relative", zIndex: 1,
                      cursor: isCompleted ? "pointer" : "default",
                    }}
                  >
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 600,
                      border: `2px solid ${isCurrent ? "#043969" : isCompleted ? "#148dc2" : "#d1d5db"}`,
                      background: isCurrent ? "#043969" : isCompleted ? "#148dc2" : "white",
                      color: isCurrent || isCompleted ? "white" : "#9ca3af",
                      boxShadow: isCurrent ? "0 0 0 4px rgba(4,57,105,0.15)" : "none",
                      transition: "all 0.3s",
                    }}>
                      {isCompleted ? <CheckCircle size={14} /> : step.id}
                    </div>
                    <span style={{
                      fontSize: "12px", fontWeight: 500,
                      color: isCurrent ? "#043969" : isCompleted ? "#374151" : "#9ca3af",
                    }}>
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Scrollable step content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 32px 16px" }}>
            {currentStep === 1 && (
              <CustomerInfo
                firstName={firstName} setFirstName={setFirstName}
                lastName={lastName} setLastName={setLastName}
                company={company} setCompany={setCompany}
                note={note} setNote={setNote}
                customerNumber={customerNumber} setCustomerNumber={setCustomerNumber}
                street={street} setStreet={setStreet}
                city={city} setCity={setCity}
                state={state} setState={setState}
                zip={zip} setZip={setZip}
                phone={phone} setPhone={setPhone}
                email={email} setEmail={setEmail}
                submitPressed={false}
              />
            )}

            {currentStep === 2 && (
              <section>
                <h3 style={{ marginTop: 0 }}>Payment Info</h3>
                <PaymentTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Amount */}
                <div style={{ marginTop: "24px", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                  <div style={{ padding: "16px" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Amount</label>
                      <input type="number" name="amount" value={formData.amount} onChange={handleScheduleChange} />
                    </div>
                  </div>

                  {!formData.isCheck && (
                    <div style={{ padding: "12px 16px", background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", marginBottom: "8px" }}>
                        <input type="checkbox" name="includeFee" checked={formData.includeFee} onChange={handleScheduleChange} />
                        Pass Transfer Fee to Client
                      </label>
                      {formData.includeFee && (
                        <div className="form-row" style={{ alignItems: "center" }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Transfer Fee %</label>
                            <input type="number" name="transferFee" min="0" max="3.5" step="0.01" value={formData.transferFee} onChange={handleScheduleChange} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Fee</label>
                            <input type="number" value={(formData.amount * (formData.transferFee / 100)).toFixed(2)} readOnly />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ padding: "12px 16px", background: "#043969", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "white", fontSize: "14px", fontWeight: 500 }}>Total Billed Per Cycle</span>
                    <span style={{ color: "white", fontSize: "18px", fontWeight: 700 }}>
                      {FormatCurrency(
                        Number(formData.amount) +
                        (formData.includeFee && !formData.isCheck
                          ? Number((formData.amount * formData.transferFee / 100).toFixed(2))
                          : 0)
                      )}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {currentStep === 3 && (
              <SchedulingInfo
                formData={formData}
                submitPressed={false}
                handleChange={handleScheduleChange}
              />
            )}

            {currentStep === 4 && (
              <div>
                <h3 style={{ marginTop: 0 }}>Review & Finalize</h3>
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", background: "white", overflow: "hidden" }}>

                  {/* Schedule */}
                  <div style={{ padding: "16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ padding: "10px", background: "#eff6ff", borderRadius: "8px", color: "#043969", flexShrink: 0, display: "flex" }}>
                      <CalendarClock size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Schedule</div>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>{formData.scheduleName || "Unnamed Schedule"}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
                        {formData.invoice && <span>Invoice Ref: <strong style={{ color: "#374151" }}>{formData.invoice}</strong></span>}
                        <span>Runs every {formData.frequencyNum} {freqLabel}.</span>
                        {formData.startDate && <span>Starts: <strong style={{ color: "#374151" }}>{formData.startDate}</strong></span>}
                        <span>Ends: <strong style={{ color: "#374151" }}>
                          {formData.endOption === "Never" && "Never (Continuous)"}
                          {formData.endOption === "Date" && (formData.endDate || "Not set")}
                          {formData.endOption === "NumberOfPayments" && `After ${formData.numberOfPayments || 0} payments`}
                        </strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Rules & Retry */}
                  <div style={{ padding: "16px", display: "flex", alignItems: "flex-start", gap: "12px", borderTop: "1px solid #f3f4f6" }}>
                    <div style={{ padding: "10px", background: "#f3f4f6", borderRadius: "8px", color: "#4b5563", flexShrink: 0, display: "flex" }}>
                      <Settings size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Rules & Retry Settings</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", display: "flex", flexDirection: "column", gap: "3px" }}>
                        <span>Skip Sabbath/Holidays: <strong style={{ color: "#374151" }}>{formData.skipDays ? "Yes" : "No"}</strong></span>
                        <span>Max Retries: <strong style={{ color: "#374151" }}>{formData.retryAttempts} times</strong></span>
                        <span>Retry After: <strong style={{ color: "#374151" }}>{formData.retryDays} days</strong></span>
                        <span>After Final Retry: <strong style={{ color: "#374151" }}>{formData.afterFail === "ContinueNextInterval" ? "Maintain schedule" : "Cancel schedule"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Financials */}
                  <div style={{ padding: "16px", display: "flex", alignItems: "flex-start", gap: "12px", borderTop: "1px solid #f3f4f6" }}>
                    <div style={{ padding: "10px", background: "#f0fdf4", borderRadius: "8px", color: "#16a34a", flexShrink: 0, display: "flex" }}>
                      <DollarSign size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Financials</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                        <span style={{ color: "#6b7280" }}>Base Amount</span>
                        <span style={{ fontWeight: 500, color: "#1f2937" }}>{FormatCurrency(baseAmount)}</span>
                      </div>
                      {fee > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                          <span style={{ color: "#6b7280" }}>Transfer Fee ({formData.transferFee}%)</span>
                          <span style={{ fontWeight: 500, color: "#1f2937" }}>{FormatCurrency(fee)}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f3f4f6" }}>
                        <span style={{ fontWeight: 600, color: "#111827" }}>Total Billed</span>
                        <span style={{ fontWeight: 600, color: "#043969" }}>{FormatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Client */}
                  <div style={{ padding: "16px", display: "flex", alignItems: "flex-start", gap: "12px", borderTop: "1px solid #f3f4f6" }}>
                    <div style={{ padding: "10px", background: "#faf5ff", borderRadius: "8px", color: "#7c3aed", flexShrink: 0, display: "flex" }}>
                      <User size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Client</div>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>{firstName} {lastName}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>{company}</div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div style={{ padding: "16px", display: "flex", alignItems: "flex-start", gap: "12px", borderTop: "1px solid #f3f4f6" }}>
                    <div style={{ padding: "10px", background: "#fff7ed", borderRadius: "8px", color: "#ea580c", flexShrink: 0, display: "flex" }}>
                      <CreditCard size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Payment Method</div>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>{activeTab === "Credit Card" ? "Credit Card" : "eCheck / ACH"}</div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {stepError && (
              <p style={{ marginTop: "12px", color: "#ef4444", fontSize: "13px", fontWeight: 500 }}>
                {stepError}
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "16px 32px",
            borderTop: "1px solid #e5e7eb",
            background: "#f9fafb",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            {currentStep > 1 ? (
              <button type="button" onClick={prevStep} style={{
                padding: "8px 16px", fontSize: "12px", fontWeight: 500,
                color: "#374151", background: "white",
                border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer",
              }}>
                Back
              </button>
            ) : <div />}

            {currentStep < STEPS.length ? (
              <button type="button" onClick={nextStep} style={{
                padding: "8px 16px", fontSize: "12px", fontWeight: 500,
                color: "#043969", background: "white",
                border: "1px solid #043969", borderRadius: "6px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                Continue to {STEPS[currentStep].name}
                <ChevronRight size={14} />
              </button>
            ) : (
              <button type="button" onClick={CreateSchedule} style={{
                padding: "8px 16px", fontSize: "12px", fontWeight: 500,
                color: "white", background: "#043969",
                border: "none", borderRadius: "6px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <CheckCircle size={14} />
                Activate Schedule
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
