import { useEffect, useState } from "react";
import { fetchWithAuth, FormatCurrency, Sort } from "../Utilities";
import { Grid } from "../Objects/Grid";
import { NewInvoice } from "../Objects/NewInvoice";
import { useSuccessModal } from "../Objects/SuccessModal";

export default function Invoices() {
  const [data,           setData]           = useState([]);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const { showSuccess, SuccessModal } = useSuccessModal();

  const [headers, setHeaders] = useState([
    { DisplayValue: "Invoice #",    Show: true, Value: "Id",                 SortString: "Id",              SortAsc: true  },
    { DisplayValue: "Insured",      Show: true, Value: "InsuredName",        SortString: "InsuredName",     SortAsc: true  },
    { DisplayValue: "Policy #",     Show: true, Value: "PolicyNumber",       SortString: "PolicyNumber",    SortAsc: true  },
    { DisplayValue: "Carrier",      Show: true, Value: "CarrierName",        SortString: "CarrierName",     SortAsc: true  },
    { DisplayValue: "Total",        Show: true, Value: "TotalAmountString",  SortString: "TotalAmount",     SortAsc: false },
    { DisplayValue: "Finance Co.",  Show: true, Value: "FinanceCompany",     SortString: "FinanceCompany",  SortAsc: true  },
    { DisplayValue: "Status",       Show: true, Value: "StatusDisplay",      SortString: "Status",          SortAsc: true  },
    { DisplayValue: "Created",      Show: true, Value: "DateCreatedDisplay", SortString: "DateCreated",     SortAsc: false },
  ]);

  async function getData() {
    const result = await fetchWithAuth("get-invoices", {});
    const formatted = (result ?? []).map(inv => ({
      ...inv,
      TotalAmount:        (inv.LineItems ?? []).reduce((s, x) => s + (x.Amount ?? 0), 0),
      TotalAmountString:  FormatCurrency((inv.LineItems ?? []).reduce((s, x) => s + (x.Amount ?? 0), 0)),
      FinanceCompany:     inv.AttachedFinanceQuote?.Company ?? "—",
      StatusDisplay:      inv.Status ? inv.Status.charAt(0).toUpperCase() + inv.Status.slice(1) : "",
      DateCreatedDisplay: inv.DateCreated ? new Date(inv.DateCreated).toLocaleDateString("en-US") : "",
    }));
    setData(formatted);
  }

  useEffect(() => { getData(); }, []);

  function sortData(field, ascending) {
    setData(Sort(data, field, ascending));
  }

  function handleSaved() {
    setShowNewInvoice(false);
    setSelectedInvoice(null);
    showSuccess("Invoice saved successfully");
    getData();
  }

  return (
    <>
      <div className="header">
        <div className="header-actions">
          <button className="btn-new-tx" type="button" onClick={() => setShowNewInvoice(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Invoice
          </button>
        </div>
      </div>

      {showNewInvoice && (
        <NewInvoice Close={() => setShowNewInvoice(false)} OnSuccess={handleSaved} />
      )}

      {selectedInvoice && (
        <NewInvoice
          invoice={selectedInvoice}
          Close={() => setSelectedInvoice(null)}
          OnSuccess={handleSaved}
        />
      )}

      <Grid
        enableFilters={false}
        rowClick={setSelectedInvoice}
        JsonObjectList={data}
        headerList={headers}
        SetHeaderList={setHeaders}
        Sort={sortData}
      />

      <SuccessModal />
    </>
  );
}
