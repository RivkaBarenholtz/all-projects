


export const SchedulingInfo = ({ formData, handleChange, submitPressed}) => {
    




  return (
    <>
      <h2>Add Schedule</h2>

      {/* Schedule Info */}
      <div >
        <div className="form-group">
            <label>Schedule Name</label>
            <input type="text" name="scheduleName" value={formData.scheduleName} onChange={handleChange} />
        </div>
        <div className="form-group">
            <label>Description</label>
            <input type="text" name="description" value={formData.description} onChange={handleChange} />
        </div>
        <div className="form-row">
            <div className="form-group">
                <label>Amount</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleChange} />
                 {submitPressed && Number(formData.amount) <= 0 ? <div className="toast show" id="toast-for-account-holder">Amount required.</div> : ''}

            </div>
            
             { formData.includeFee && !formData.isCheck && <><div className="form-group">
                <label>Transfer Fee</label>
                <input type="number" name="electronicFee" value={(formData.amount * (formData.transferFee/100))?.toFixed(2)}  readOnly />

            </div>
            <div className="form-group">
                <label>Total Amount</label>
                <input type="number" name="totalAmount" value={((formData.amount * (formData.transferFee/100)) + Number(formData.amount))?.toFixed(2)} readOnly />
            </div>
            </>}
           
        </div>
      </div>
         {!formData.isCheck && <><div className="form-group">
           
            <input type="checkbox" name="includeFee" checked={formData.includeFee} onChange={handleChange} />
            Include Transfer Fee
            
        </div>
      {/* Electronic Transfer Fee */}
      {formData.includeFee && <div className="form-row">
        <div className="form-group percent-input-wrapper">
                 <label >
                Transfer Fee: 
            </label>
            
            <input
                type="number"
                name="transferFee"
                min="0"
                max="3.5"
                step="0.01"
                value={formData.transferFee}
                onChange={handleChange}
                placeholder="0"
            />
            <span className="percent-sign">%</span>
           
            </div>
            
        <div className="form-group">
                 <label>&nbsp; </label>
            <input
                className="arrow-slider"
                type="range"
                id="transferFee"
                name="transferFee"
                min="0"
                max="3.5"
                step="0.01"
                value={formData.transferFee}
                onChange={handleChange}
            />
            </div>
      </div>
        }</>}
      {/* Invoice */}
      
        <div className="form-group">
            <label>Invoice</label>
            <input type="text" name="invoice" value={formData.invoice} onChange={handleChange} />
        </div>


      {/* Frequency */}
      <div className="form-row" >
        <div className="form-group">
        <label>Frequency</label>
         <input type="text" name="frequencyNum" value={formData.frequencyNum} onChange={handleChange} />
          {submitPressed && formData.frequencyNum <= 0 ? <div className="toast show" id="toast-for-account-holder">Frequency required.</div> : ''}

        </div>
         <div className="form-group">
            <label>Type</label>
        <select name="frequency" value={formData.frequency} onChange={handleChange}>
          <option value="day">Day(s)</option>
          <option value="week">Week(s)</option>
          <option value="month">Month(s)</option>
          <option value="year">Year(s)</option>
        </select>
        </div>
          </div>
        {/* <label>
          <input type="checkbox" name="runSpecificDay" checked={formData.runSpecificDay} onChange={handleChange} />
          Run recurring at a specific day of the week
        </label> */}
        <label>
          <input type="checkbox" name="skipDays" checked={formData.skipDays} onChange={handleChange} />
          Skip Sabbath and Holidays
        </label>
    

      {/* Calendar */}
      {/* <div className="form-group">
        <label>Calendar Type</label>
        <select name="calendarType" value={formData.calendarType} onChange={handleChange}>
          <option value="Gregorian">Gregorian</option>
          <option value="Hebrew">Hebrew</option>
        </select>
      </div> */}

      {/* Dates */}
      <div className="form-group">
        <label>End Type</label>
            <select name="endOption" value={formData.endOption} onChange={handleChange}>
                <option value="Never">Never</option>
                <option value="Date">Date</option>
                <option value="NumberOfPayments">Number of Payments</option>
            </select>
        </div>
      <div className="form-row">
        <div className="form-group">
            <label>Start</label>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
        </div>
        
        { formData.endOption == "Date" && <div className="form-group">
            <label>End</label>
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
             {submitPressed && formData.endDate == "" ? <div className="toast show" id="toast-for-account-holder">End date required.</div> : ''}

        </div>
        }
         { formData.endOption == "NumberOfPayments" && <div className="form-group">
            <label>Number Of Payments</label>
            <input type="number" name="numberOfPayments" value={formData.numberOfPayments} onChange={handleChange} />
             {submitPressed && formData.numberOfPayments <=0  ? <div className="toast show" id="toast-for-account-holder"># of pymnts required.</div> : ''}

        </div>
        }
        
      </div>

      {/* Options */}
      {/* <div className="form-row">
        <label>
          <input type="checkbox" name="sendReceipt" checked={formData.sendReceipt} onChange={handleChange} />
          Send receipt
        </label>
        <label>
          <input type="checkbox" name="retryDefaultCard" checked={formData.retryDefaultCard} onChange={handleChange} />
          Retry declined recurring with default card only
        </label>
        <label>
          <input type="checkbox" name="createOnFail" checked={formData.createOnFail} onChange={handleChange} />
          Create the schedule even if the initial payment fails
        </label>
      </div> */}

      {/* Retry Settings */}
      <div className="form-section">
        <h3>Retry settings</h3>
        <div className="form-row">
            <div className="form-group">
                <label>Retry Times</label>
                <input type="number" name="retryAttempts" value={formData.retryAttempts} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Retry after how many days?</label>
                <input type="number" name="retryDays" value={formData.retryDays} onChange={handleChange} />
            </div>
        </div>
        <div className="form-group">
            <label>After final retry</label>
            <select name="afterFail" value={formData.afterFail} onChange={handleChange}>
                <option value="ContinueNextInterval">Maintain schedule</option>
                <option value="Disable">Cancel schedule</option>
            </select>
        </div>
      </div>

      {/* Custom Fields */}
      {/* <div className="form-row">
        <h3>Custom Fields</h3>
        <input type="text" name="custom1" placeholder="Custom1" value={formData.custom1} onChange={handleChange} />
        <input type="text" name="custom2" placeholder="Custom2" value={formData.custom2} onChange={handleChange} />
      </div> */}

     
    </>
  );
}

