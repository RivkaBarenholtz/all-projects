import { useEffect, useRef, useState } from 'react';

import { fetchWithAuth, FormatCurrency } from './Utilities';
import { Grid } from './Objects/Grid';

import PaymentForm from './PaymentPage/PaymentForm'
import TransactionDetail from './Objects/TransactionDetail';
import { ColumnDropdown } from './Objects/ColumnDropdown';
import { Car, X } from 'lucide-react';
import cardknoxErrors from './Data/ErrorCodes.json';
import { ConfirmationModal } from './Objects/ConfimationModal';
import { Card } from './Components/UI/card';
import { set } from 'date-fns';

function Transactions({ user }) {


  const beginParam = new URLSearchParams(window.location.search).get("beginDate");
  const endParam = new URLSearchParams(window.location.search).get("endDate");
  const accountIDParam = new URLSearchParams(window.location.search).get("accountID");
  const refNumParam = new URLSearchParams(window.location.search).get("refNum");


  // const sixDaysAgo = new Date() - 6 
  const [beginDate, setBeginDate] = useState(beginParam??new Date(new Date().setDate(new Date().getDate() - 6)))
  const [endDate, setEndDate] = useState(endParam??new Date())
  const [showError, setShowError] = useState(false)
  const [activePage, setActivePage] = useState(1);
  const [filters, setFilters] = useState({});
  const [totalResults, setTotalResults] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [customBeginDate, setCustomBeginDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [accountID, setAccountID] = useState(accountIDParam??"");
  const [showSuccess, setShowSuccess] = useState(false);
  const [dateRangeOption, setDateRangeOption] = useState(beginParam|| endParam?"Custom":"last7Days");
  const [selectedRefNum, setSelectedRefNum] = useState(refNumParam??"");






  const [headers, setHeaders] = useState([
    {
      DisplayValue: "Ref #",
      Show: true,
      Value: "xRefNumHtml",
      FilterValue: "xRefNum",
      SortString: "RefNumber",
      FilterType: "text",
      SortAsc: true
    },
    {
      DisplayValue: "Date",
      Show: true,
      Value: "EnteredDateFormatted",
      FilterValue: "xEnteredDate",
      SortString: "Date",
      FilterType: "none",
      SortAsc: false
    },
    {
      DisplayValue: "Status",
      Show: true,
      Value: "StatusHtml",
      SortString: "Status",
      FilterValue: "StatusString",
      SortAsc: true
    },

    {
      DisplayValue: "Funded",
      Show: false,
      Value: "AmountFundedFormatted",
      SortString: "FundedAmount",
      FilterValue: "AmountFunded",
      FilterType: "number",
      SortAsc: true
    },


    {
      DisplayValue: "Fee",
      Show: false,
      Value: "CreditCardFormatted",
      FilterValue: "CreditCardFee",
      FilterType: "number",
      SortString: "TransactionFee",
      SortAsc: true
    },


    {
      DisplayValue: "Total",
      Show: true,
      Value: "AmountFormatted",
      FilterValue: "xAmount",
      SortString: "Amount",
      FilterType: "number",
      SortAsc: true
    },


    {
      DisplayValue: "Cardholder",
      Show: true,
      Value: "xName",
      FilterValue: "xName",
      SortString: "Name",
      FilterType: "text",
      SortAsc: true
    },
    {
      DisplayValue: "Account ID",
      Show: true,
      Value: "xBillLastName",
      SortString: "xBillLastName",
      FilterValue: "xBillLastName",
      FilterType: "text",
      SortAsc: true
    },
    {
      DisplayValue: "Account #",
      Show: true,
      Value: "xMaskedAccountNumberHtml",
      FilterValue: "xMaskedAccountNumber",
      SortString: "MaskedAccountNumber",
      FilterType: "text",
      SortAsc: true
    },

    {
      DisplayValue: "Payment Method",
      Show: false,
      Value: "xPaymentMethodHtml",
      FilterValue: "PaymentMethod",
      SortString: "PaymentMethod",
      SortAsc: true
    },

    {
      DisplayValue: "Command",
      Show: true,
      Value: "xCommand",
      FilterValue: "xCommand",
      SortString: "Command",
      SortAsc: true
    },



    {
      DisplayValue: "Error",
      Show: true,
      Value: "ErrorDescription",
      FilterValue: "ErrorDescription",
      SortString: "ResponseCode",
    },

    {
      DisplayValue: "Description",
      Show: false,
      Value: "xDescription",
      FilterValue: "xDescription",
      SortString: "Description",
      FilterType: "text",
      SortAsc: true
    },


    {
      DisplayValue: "Customer ID",
      Show: false,
      Value: "xCustom01",
      FilterValue: "xCustom01",
      SortString: "CardknoxCustomer",
      FilterType: "text",
      SortAsc: true
    },


    {
      DisplayValue: "CSR Code",
      Show: false,
      Value: "xCustom02",
      SortString: "CsrCode",
      FilterType: "text",
      SortAsc: true
    },


    {
      DisplayValue: "CSR Email",
      Show: false,
      Value: "xCustom03",
      SortString: "CsrEmail",
      FilterType: "text",
      SortAsc: true
    }

  ])
  const [transactions, setTransactions] = useState([])
  const [previousOption, setPreviousOption] = useState({})
  const [selectedOption, setSelectedOption] = useState({
    label: "Last 7 Days",
    value: 'Last7'
  });
  const [showNewTransScreen, setShowNewTransScreen] = useState(false);
  const [refNum, setRefNum] = useState("")

  const customDateRef = useRef()

  useEffect(() => {
    // setShowCustomDateRange(false);
    function handleClickOutside(event) {
      if (customDateRef.current && !customDateRef.current.contains(event.target)) {
        setSelectedOption(previousOption);
        setShowCustomDateRange(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [previousOption]);


  function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const dateRangeOptions = [
    {
      label: "Today",
      value: 'Today'
    },
    {
      label: "Yesterday",
      value: 'Yesterday'
    },
    {
      label: "This Month",
      value: 'ThisMonth'
    },
    {
      label: "Last Month",
      value: 'LastMonth'
    },
    {
      label: "Last 7 Days",
      value: 'Last7'
    },
    {
      label: "Last 30 Days",
      value: 'Last30'
    },
    {
      label: "Last 60 Days",
      value: 'Last60'
    },
    {
      label: "Last 90 Days",
      value: 'Last90'
    },
    {
      label: "Custom Range",
      value: "Custom"
    }
  ]

  const [pmntMethodOptions, setPaymentMethodOptions] = useState([

    {
      label: "Wire",
      value: "Wire",
      isSelected: true

    },
    {
      label: "Credit Card",
      value: "CC",
      isSelected: true

    },
    {
      label: "Check",
      value: "Check",
      isSelected: true
    }
  ]);

  const [statusOptions, setStatusOptions] = useState([
    {
      label: "Approved",
      value: "21",
      isSelected: true
    },
    {
      label: "Approved-Pending",
      value: "22",
      isSelected: true
    },
    {
      label: "ACH Returned",
      value: "23",
      isSelected: true
    },
    {
      label: "Declined",
      value: "24",
      isSelected: true
    },
    {
      label: "Error",
      value: "25",
      isSelected: true
    }


  ]
  )

  const getFilters = () => {
    const filteredOption = statusOptions.filter(a => a.isSelected);
    const filteredPmntMethods = pmntMethodOptions.filter(a => a.isSelected);
    return {
      TransactionsPerPage: 100000,
      PageNumber: activePage,
      SortBy: "Date",
      isAsc: false,
      FromDate: beginDate,
      ToDate: endDate,
      IncludeError: showError,
      RefNum: refNum,
      Statuses: filteredOption.length == statusOptions.length ? [-1] : statusOptions.filter(a => a.isSelected).map(f => f.value),
      PaymentMethods: filteredPmntMethods.length == pmntMethodOptions.length ? ["ALL"] : pmntMethodOptions.filter(a => a.isSelected).map(f => f.value),
      AccountID: accountID


    }

  }

  const paymentErrorMap = Object.fromEntries(
    cardknoxErrors.map(e => [e.code, e.message])
  );

  const search = async (filters) => {
    const response = await fetchWithAuth("transaction-report", filters);
    var responseFormatted = response.xReportData.map((trans) => {

      const date = new Date(trans.xEnteredDate);
      const localDateString = date.toLocaleDateString('en-US');


      return {
        ...trans,
        xRefNumHtml: <div style={{ display: "flex" }}><span className='transaction-id'> {trans.xRefNum}</span> {trans.xVoid == 1 && <span className='void-span'>Void</span>} </div>,
        EnteredDateFormatted: localDateString,
        xMaskedAccountNumberHtml: CardHtml(trans.xMaskedAccountNumber, trans.xCardType, trans.xCommand),
        CreditCardFormatted: <span className={`'amount ' ${trans.xVoid == 1 ? "void" : ""}`}> {FormatCurrency(trans.xCustom09 * (trans.xAmount != 0 ? trans.xAmount / Math.abs(trans.xAmount) : 1)) ?? '$0.00'}</span>,
        AmountFundedFormatted: trans.xCustom10 == 0 || trans.xCustom10 == null ? AmountHtml(trans.xAmount, trans.xVoid == 1) : AmountHtml(trans.xCustom10 * (trans.xAmount != 0 ? trans.xAmount / Math.abs(trans.xAmount) : 1), trans.xVoid == 1),
        StatusHtml: StatusHtml(trans.xResponseResult, trans.xStatus, trans.xCommand),
        AmountFormatted: AmountHtml(trans.xAmount, trans.xRequestAmount, trans.xVoid == 1),
        AmountFunded: trans.xCustom10 && trans.xCustom10 > 0 ? trans.xCustom10 * (trans.xAmount != 0 ? trans.xAmount / Math.abs(trans.xAmount) : 1) : trans.xAmount,
        StatusString: GetStatusString(trans.xResponseResult, trans.xStatus, trans.xCommand),
        CreditCardFee: trans.xCustom09 * (trans.xAmount != 0 ? trans.xAmount / Math.abs(trans.xAmount) : 1),
        ErrorDescription: paymentErrorMap[Number(trans.xErrorCode)] || "",
        xPaymentMethodHtml: <>{CardImage(trans.xCardType, trans.xCommand)} <span className="card-last4"> {PaymentMethod(trans.xCardType, trans.xCommand)}</span></>,
        PaymentMethod: PaymentMethod(trans.xCardType, trans.xCommand),
        className: trans.xResponseResult.toLowerCase() == "approved" ? "" : "not-counted"
      }
    })
    if(selectedRefNum && selectedRefNum != ""){
      const selectedTrans = responseFormatted.find(t => t.xRefNum == selectedRefNum);
      setSelectedTransaction(selectedTrans);
      setSelectedRefNum("") // Clear the selected ref num after opening the transaction detail
    }
    setTransactions(responseFormatted);
    setTotalResults(response.xRecordsReturned);
    setTotal(response.xResult);
  }
  const AmountHtml = (amt, origAmt, isVoided) => {
    if (isVoided) return <span className='amount void'>{FormatCurrency(origAmt)}</span>
    return amt >= 0 ? <span className='amount positive'>{FormatCurrency(amt)}</span> :
      <span className='amount negative'>{FormatCurrency(amt)}</span>
  }

  const GetStatusString = (responseResult, achStatus, command) => {
    const ach =
      responseResult === "Approved"
        ? achStatus === "14"
          ? "Approved-Chargeback"
          : achStatus === "16"
            ? "Approved-Settled"
            : "Approved-Pending"
        : responseResult;

    const isAch = command === "Check:Sale";
    const isWire = command === "Send Wire";

    const statusString = isAch ? ach : isWire ? achStatus : responseResult;
    return statusString;

  }

  const StatusHtml = (responseResult, achStatus, command) => {


    const statusString = GetStatusString(responseResult, achStatus, command);

    let classes = "status ";

    switch (statusString.toLowerCase()) {
      case "approved":
      case "approved-settled": // ✅ stack case labels
      case "confirmed":
        classes += "approved";
        break;

      case "approved-chargeback":
        classes += "chargeback";
        break;

      case "approved-pending":
      case "unconfirmed":
        classes += "pending";
        break;



      default:
        classes += "error";
        break;
    }

    return <span className={classes}>{statusString}</span>;
  };

  const CardHtml = (maskedNumber, xCardType, xCommand) => {

    return <div style={{ display: "flex" }}>

      {CardImage(xCardType, xCommand)}
      <span className="card-last4">{`****${maskedNumber.replace(/x/gi, "")}`}</span>
    </div>
  }

  const PaymentMethod = (xCardType, xCommand) => {
    if (xCommand.startsWith("Check")) return "ACH";
    if (xCommand.startsWith("Send Wire")) return "Wire";
    return xCardType;
  }
  const CardImage = (xCardType, xCommand) => {
    let imgSrc = "";
    if (xCommand.startsWith("Check")) imgSrc = "https://bz-sandbox.s3.us-east-1.amazonaws.com/ach.svg";
    if (xCommand.startsWith("Send Wire")) imgSrc = "https://bz-sandbox.s3.us-east-1.amazonaws.com/wire.svg";
    if (xCardType === "Visa") imgSrc = "https://bz-sandbox.s3.us-east-1.amazonaws.com/visa.svg";
    if (xCardType === "MasterCard") imgSrc = "https://bz-sandbox.s3.us-east-1.amazonaws.com/mastercard.svg";
    if (xCardType === "Amex") imgSrc = "https://bz-sandbox.s3.us-east-1.amazonaws.com/amex.svg";
    if (xCardType === "Discover") imgSrc = "https://bz-sandbox.s3.us-east-1.amazonaws.com/discover.svg";

    return <img src={imgSrc} className="pm-logo"></img>

  }


  const defaultSearch = async () => {
    const filters = getFilters();

    await search(filters)
  }

  const ApplyFilters = async () => {
    setActivePage(1);
    const filters = {
      ...getFilters(),
      PageNumber: 1
    }
    await search(filters)
  }

  const setCustomDateRange = () => {


    // Hide the custom date picker
    setShowCustomDateRange(false);

    // Optionally update your global begin/end date filters:
    setBeginDate(customBeginDate);
    setEndDate(customEndDate);
  }


  const ExportToCsv = async () => {
    const filters = {
      ...getFilters(),
      TransactionsPerPage: 1000000,
      PageNumber: 1
    }
    const responseText = await fetchWithAuth("export-transactions-to-csv", filters, true);
    const blob = new Blob([responseText], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transactions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    URL.revokeObjectURL(link.href);

  }

  useEffect(() => {

    async function getData() {
      await defaultSearch()
    }
    getData()
  }

    , [activePage])

  const ChangeOption = (option) => {

    setDateRangeOption(option);

    if (option == "Custom") {
      setPreviousOption({ ...selectedOption });
      setShowCustomDateRange(true);
    }

    const optionObj = dateRangeOptions.find((o) => o.value === option);
    setSelectedOption(optionObj);
    switch (option) {
      case "Today": {
        const today = new Date();
        setBeginDate(new Date(today.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      }

      case "Yesterday": {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setBeginDate(new Date(yesterday.setHours(0, 0, 0, 0)));
        setEndDate(new Date(yesterday.setHours(23, 59, 59, 999)));
        break;
      }

      case "ThisMonth": {
        const today = new Date();
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setBeginDate(new Date(firstOfMonth.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      }

      case "LastMonth": {
        const today = new Date();
        const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastOfLastMonth = new Date(firstOfThisMonth - 1);
        lastOfLastMonth.setHours(23, 59, 59, 999);
        setBeginDate(new Date(firstOfLastMonth.setHours(0, 0, 0, 0)));
        setEndDate(lastOfLastMonth);
        break;
      }

      case "Last7": {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 6);
        setBeginDate(new Date(start.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      }

      case "Last30": {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 29);
        setBeginDate(new Date(start.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      }

      case "Last60": {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 59);
        setBeginDate(new Date(start.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      }

      case "Last90": {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 89);
        setBeginDate(new Date(start.setHours(0, 0, 0, 0)));
        setEndDate(new Date());
        break;
      }
    }
  }

  useEffect(() => {
    if (!showCustomDateRange) {
      ApplyFilters();
    }
  }, [beginDate, endDate])


  const Sort = async (sortBy,
    isAsc
  ) => {
    const filters = {
      ...getFilters(),
      SortBy: sortBy,
      IsAsc: isAsc
    }
    search(filters);
  }

  const formatDateDisplay = () => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${beginDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  return (
    <form>
      {selectedTransaction &&
        <TransactionDetail
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
          getTransactions={defaultSearch}
          role={user?.Role?.toLowerCase()}
        />
      }
      {
        showSuccess && <ConfirmationModal

          onClose={() => { setShowSuccess(false); search(getFilters()); }}
          showButton={false}>
          <div>
            <h2> Transaction Successful</h2>
          </div>
        </ConfirmationModal>
      }

      <div className="transactions-page">
        {showNewTransScreen && (
          <div className="modal-overlay">
            <div className="modal">
              <button
                onClick={() => setShowNewTransScreen(false)}
                type='button'
                className="modal-close"
              >
                &times;
              </button>
              <PaymentForm
                isPortal={true}
                onSuccess={() => {

                  setShowNewTransScreen(false);
                  setShowSuccess(true);

                }}
              />
            </div>
          </div>
        )}



        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <div className="date-section">
              <div className="date-controls">
                <label>Date Range:</label>
                <select
                  value={selectedOption.value}
                  onChange={(e) => ChangeOption(e.target.value)}
                  className="date-select"
                >
                  {dateRangeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {showCustomDateRange && (
                  <div className="custom-date-inputs" ref={customDateRef}>
                    <input
                      type="date"
                      value={formatDateLocal(customBeginDate)}
                      onChange={(e) => {
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        setCustomBeginDate(new Date(year, month - 1, day))
                      }}
                    />
                    <span style={{ color: '#6b7280' }}>to</span>
                    <input
                      type="date"
                      value={formatDateLocal(customEndDate)}
                      onChange={(e) => {
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        const end = new Date(year, month - 1, day)
                        end.setHours(23, 59, 59, 999)
                        setCustomEndDate(end)
                      }}
                    />
                    <button
                      type='button'
                      className='btn-apply-date'
                      onClick={setCustomDateRange}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
              {!showCustomDateRange && (
                <div className="date-text-display">{formatDateDisplay()}

                  {
                    dateRangeOption == "Custom" && <a
                      style={{
                        color: "blue",
                        textDecoration: "underline",
                        margin: "10px",
                      }}
                      onClick={() => setShowCustomDateRange(true)}>Edit</a>
                  }

                </div>
              )}
            </div>

            <div className="summary-wrapper">
              <div className="summary-box-item">
                <div className="summary-label">Transactions</div>
                <div className="summary-value">{totalResults}</div>
              </div>
              <div className="summary-box-item">
                <div className="summary-label">Total Approved</div>
                <div className="summary-value green">{FormatCurrency(total)}</div>
              </div>
            </div>
          </div>

          <div className="header-right">
            {user?.Role?.toLowerCase() != "viewer" &&

              <button
                className="btn-new-tx"
                type="button"
                onClick={() => setShowNewTransScreen(true)}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                New Transaction
              </button>
            }

            <div className="secondary-actions">
              <button
                className="action-btn"
                onClick={ExportToCsv}
                type='button'
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Export
              </button>
              <button className="action-btn" type="button">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                </svg>
                Print
              </button>

              <ColumnDropdown
                headerList={headers}
                setHeaderList={setHeaders}
              />
            </div>
          </div>
        </div>


        {/* Grid */}
        <div className="table-wrapper-main">
          <Grid
            headerList={headers}
            SetHeaderList={setHeaders}
            JsonObjectList={transactions}
            filters={filters}
            setFilters={setFilters}
            isSelectable={false}
            title={'Recent Transactions'}
            numberOfItems={totalResults}
            itemsPerPage={100000}
            activePage={activePage}
            setActivePage={setActivePage}
            Sort={Sort}
            rowClick={setSelectedTransaction}
            showTotals={true}
          />
        </div>
      </div>
    </form>
  );
};

export default Transactions;
