export const CustomerInfo = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  company,
  setCompany,
  note,
  setNote,
  customerNumber,
  setCustomerNumber,
  street,
  setStreet,
  city,
  setCity,
  state,
  setState,
  zip,
  setZip,
  phone,
  setPhone,
  email,
  setEmail, 
  submitPressed

}) => {
  return (
    <>
      {/* Customer Info Section */}
      <section className="form-section">
        <h3>Customer Info</h3>
        <div className="form-row">
          <div className="form-group">
            <label>First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            {submitPressed && firstName == "" ? <div className="toast show" id="toast-for-account-holder">First name required.</div> : ''}

          </div>
          
          <div className="form-group">
            <label>Last Name *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
              {submitPressed && lastName == "" ? <div className="toast show" id="toast-for-account-holder">Last name required.</div> : ''}

          </div>
        </div>

        <div className="form-group">
          <label>Company *</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
           {submitPressed && company == "" ? <div className="toast show" id="toast-for-account-holder">Company required.</div> : ''}

        </div>

        <div className="form-group">
          <label>Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Customer #</label>
          <input
            type="text"
            value={customerNumber}
            onChange={(e) => setCustomerNumber(e.target.value)}
          />
        </div>
      </section>

      <section className="form-section">
        <h3>Address Info</h3>
        <div className="form-group">
          <label>Street</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Zip</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3>Contact Info</h3>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="text"
            placeholder="(718)-000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="text"
            placeholder="user@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </section>
    </>
  );
};
