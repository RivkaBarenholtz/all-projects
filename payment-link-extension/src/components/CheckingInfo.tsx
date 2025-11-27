import React from "react";

interface CheckingInfoProps {
  submitPressed: boolean;
  accountName: string;
  setAccountName: (value: string) => void;
  accountType: string;
  setAccountType: (value: string) => void;
  accountNumber: string;
  setAccountNumber: (value: string) => void;
  routingNumber: string;
  setRoutingNumber: (value: string) => void;
}

export const CheckingInfo: React.FC<CheckingInfoProps> = ({
  submitPressed,
  accountName,
  setAccountName,
  accountType,
  setAccountType,
  accountNumber,
  setAccountNumber,
  routingNumber,
  setRoutingNumber,
}) => {
  return (
    <>
      <div className="form-group">
        <label className="form-label">Select Account Type:</label>
        <select
          className="form-input"
          id="accountType"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
        >
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="account-name" className="form-label">
          Account Holder Name
        </label>
        <input
          type="text"
          id="account-name"
          name="account-name"
          className={`form-input ${
            submitPressed && accountName === "" ? "invalid" : ""
          }`}
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
        />
        {submitPressed && accountName === "" && (
          <div className="toast show" id="toast-for-account-holder">
            Account holder name required.
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="account-number" className="form-label">
          Account Number
        </label>
        <input
          type="text"
          id="account-number"
          name="account-number"
          className={`form-input ${
            submitPressed && accountNumber === "" ? "invalid" : ""
          }`}
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
        />
        {submitPressed && accountNumber === "" && (
          <div className="toast show" id="toast-for-account-number">
            Account number required.
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="routing-number" className="form-label">
          Routing Number
        </label>
        <input
          type="text"
          id="routing-number"
          name="routing-number"
          className={`form-input ${
            submitPressed && routingNumber === "" ? "invalid" : ""
          }`}
          value={routingNumber}
          onChange={(e) => setRoutingNumber(e.target.value)}
        />
        {submitPressed && routingNumber === "" && (
          <div className="toast show" id="toast-for-routing-number">
            Routing number required.
          </div>
        )}
      </div>
    </>
  );
};
