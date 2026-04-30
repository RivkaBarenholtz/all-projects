import { AiField } from "./AiField";

export const CustomerInfo = ({
  firstName, setFirstName,
  lastName, setLastName,
  company, setCompany,
  note, setNote,
  customerNumber, setCustomerNumber,
  street, setStreet,
  city, setCity,
  state, setState,
  zip, setZip,
  phone, setPhone,
  email, setEmail,
  submitPressed,
  isLocked = () => false,
  unlockField = () => {},
  onHighlight = () => {},
}) => {
  return (
    <>
      {/* Customer Info Section */}
      <section className="form-section">
        <h3>Customer Info</h3>
        <div className="form-row">
          <div className="form-group">
            <label>First Name *</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            {submitPressed && firstName == "" ? <div className="toast show" id="toast-for-account-holder">First name required.</div> : ''}
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            {submitPressed && lastName == "" ? <div className="toast show" id="toast-for-account-holder">Last name required.</div> : ''}
          </div>
        </div>

        <div className="form-row">
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
            <label>Customer #</label>
            <input
              type="text"
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}></textarea>
        </div>

     
      </section>

      <section className="form-section">
        <h3>Address Info</h3>
        <div className="form-group">
          <label>Street</label>
          <AiField field="street" locked={isLocked('street')} onUnlock={unlockField} onHighlight={onHighlight}>
            <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} />
          </AiField>
          {submitPressed && street === "" ? <div className="toast show">Street required.</div> : ''}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <AiField field="city" locked={isLocked('city')} onUnlock={unlockField} onHighlight={onHighlight}>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
            </AiField>
            {submitPressed && city === "" ? <div className="toast show">City required.</div> : ''}
          </div>
          <div className="form-group">
            <label>State</label>
            <AiField field="state" locked={isLocked('state')} onUnlock={unlockField} onHighlight={onHighlight}>
              <input type="text" value={state} onChange={(e) => setState(e.target.value)} />
            </AiField>
            {submitPressed && state === "" ? <div className="toast show">State required.</div> : ''}
          </div>
          <div className="form-group">
            <label>Zip</label>
            <AiField field="zip" locked={isLocked('zip')} onUnlock={unlockField} onHighlight={onHighlight}>
              <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} />
            </AiField>
            {submitPressed && zip === "" ? <div className="toast show">Zip required.</div> : ''}
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3>Contact Info</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="(718)-000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {submitPressed && phone === "" ? <div className="toast show">Phone required.</div> : ''}
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
        </div>
      </section>
    </>
  );
};
