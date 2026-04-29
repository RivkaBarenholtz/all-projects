
const btnStyle = (active) => ({
  flex: 1, padding: "7px 0", fontSize: "12px", fontWeight: 500,
  border: "none", borderRadius: "6px", cursor: "pointer",
  background: active ? "white" : "transparent",
  color: active ? "#043969" : "#6b7280",
  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
  transition: "all 0.15s",
});

const questionLabel = { margin: "0 0 8px", fontSize: "13px", fontWeight: 600, color: "#374151" };

export const SchedulingInfo = ({ formData, handleChange, submitPressed, mode }) => {
  const firstInstallmentIsNow = !formData.startDate;

  return (
    <>
      <h3 style={{ marginTop: 0 }}>{mode === "edit" ? "Edit Schedule" : "Schedule Details"}</h3>

      {/* Schedule Name + Invoice */}
      <div className="form-row">
        <div className="form-group">
          <label>Schedule Name</label>
          <input type="text" name="scheduleName" value={formData.scheduleName} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Invoice</label>
          <input type="text" name="invoice" value={formData.invoice} onChange={handleChange} />
        </div>
      </div>

      {/* First installment — all on one line */}
      <p style={questionLabel}>When should the first payment be charged?</p>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <div style={{
          display: "flex", gap: "4px", padding: "4px",
          background: "#f3f4f6", borderRadius: "8px", flexShrink: 0, width: "260px",
        }}>
          <button
            type="button"
            style={btnStyle(firstInstallmentIsNow)}
            onClick={() => handleChange({ target: { name: "startDate", value: "" } })}
          >
            Now
          </button>
          <button
            type="button"
            style={btnStyle(!firstInstallmentIsNow)}
            onClick={() => {
              if (firstInstallmentIsNow)
                handleChange({ target: { name: "startDate", value: new Date().toISOString().split("T")[0] } });
            }}
          >
            Specific Date
          </button>
        </div>
        {!firstInstallmentIsNow && (
          <input
            type="date"
            name="startDate"
            value={formData.startDate ? new Date(formData.startDate).toISOString().split("T")[0] : ""}
            onChange={handleChange}
            style={{ width: "130px", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }}
          />
        )}
      </div>

      {/* Frequency */}
      {mode !== "edit" && (
        <>
          <p style={questionLabel}>How often should this schedule run?</p>
          <div className="form-row">
            <div className="form-group">
              <label>Every</label>
              <input type="text" name="frequencyNum" value={formData.frequencyNum} onChange={handleChange} />
              {submitPressed && formData.frequencyNum <= 0 && (
                <div className="toast show">Frequency required.</div>
              )}
            </div>
            <div className="form-group">
              <label>Period</label>
              <select name="frequency" value={formData.frequency} onChange={handleChange}>
                <option value="day">Day(s)</option>
                <option value="week">Week(s)</option>
                <option value="month">Month(s)</option>
                <option value="year">Year(s)</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Skip Shabbos — green toggle */}
      <div
        onClick={() => handleChange({ target: { name: "skipDays", type: "checkbox", checked: !formData.skipDays } })}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
          marginBottom: "16px",
          background: formData.skipDays ? "#f0fdf4" : "#f9fafb",
          border: `1px solid ${formData.skipDays ? "#86efac" : "#e5e7eb"}`,
          transition: "all 0.2s",
        }}
      >
        <div style={{
          width: "36px", height: "20px", borderRadius: "10px", flexShrink: 0,
          background: formData.skipDays ? "#16a34a" : "#d1d5db",
          position: "relative", transition: "background 0.2s",
        }}>
          <div style={{
            position: "absolute", top: "3px",
            left: formData.skipDays ? "19px" : "3px",
            width: "14px", height: "14px", borderRadius: "50%",
            background: "white", transition: "left 0.2s",
          }} />
        </div>
        <span style={{ fontSize: "13px", fontWeight: 500, color: formData.skipDays ? "#15803d" : "#374151" }}>
          Skip Shabbos and Holidays
        </span>
      </div>

      {/* End section */}
      <p style={{ ...questionLabel, marginTop: "8px" }}>When should this schedule end?</p>
      <div className="form-row" style={{ alignItems: "flex-start" }}>
        <div className="form-group">
          <label>End Type</label>
          <select name="endOption" value={formData.endOption} onChange={handleChange}>
            <option value="Never">Never</option>
            <option value="Date">On a specific date</option>
            <option value="NumberOfPayments">After a number of payments</option>
          </select>
        </div>
        {formData.endOption === "Date" && (
          <div className="form-group">
            <label>End Date</label>
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
            {submitPressed && formData.endDate === "" && (
              <div className="toast show">End date required.</div>
            )}
          </div>
        )}
        {formData.endOption === "NumberOfPayments" && (
          <div className="form-group">
            <label>Number of Payments</label>
            <input type="number" name="numberOfPayments" value={formData.numberOfPayments} onChange={handleChange} />
            {submitPressed && formData.numberOfPayments <= 0 && (
              <div className="toast show"># of payments required.</div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Retry Settings — gray background */}
      <div style={{
        marginTop: "8px", background: "#f3f4f6", borderRadius: "8px",
        padding: "16px", border: "1px solid #e5e7eb",
      }}>
        <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 600, color: "#374151" }}>
          Advanced Error &amp; Retry Settings
        </p>
        <div className="form-row">
          <div className="form-group">
            <label>Retry Times</label>
            <input type="number" name="retryAttempts" value={formData.retryAttempts} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Retry After (days)</label>
            <input type="number" name="retryDays" value={formData.retryDays} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>After Final Retry</label>
          <select name="afterFail" value={formData.afterFail} onChange={handleChange}>
            <option value="ContinueNextInterval">Maintain schedule</option>
            <option value="Disable">Cancel schedule</option>
          </select>
        </div>
      </div>
    </>
  );
};
