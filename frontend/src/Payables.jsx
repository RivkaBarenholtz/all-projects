import { useEffect, useState } from "react";
import { fetchWithAuth } from "./Utilities";
import { useSuccessModal } from "./Objects/SuccessModal";
import { Grid } from "./Objects/Grid";
import { NewPayable } from "./Objects/NewPayable";

const headers = [
    { DisplayValue: "Vendor", Show: true, Value: "VendorName", SortString: "VendorName", SortAsc: true },
    { DisplayValue: "Amount", Show: true, Value: "Amount", SortString: "Amount", SortAsc: true },
    { DisplayValue: "Invoice ID", Show: true, Value: "InvoiceId", SortString: "InvoiceId", SortAsc: true },
    { DisplayValue: "Policy ID", Show: true, Value: "PolicyId", SortString: "PolicyId", SortAsc: true },
    { DisplayValue: "Payment Account #", Show: true, Value: "PaymentAccountNumber", SortString: "PaymentAccountNumber", SortAsc: true },
    { DisplayValue: "Payment Routing #", Show: true, Value: "PaymentRoutingNumber", SortString: "PaymentRoutingNumber", SortAsc: true },
    { DisplayValue: "Ref #", Show: true, Value: "PaymentRefNum", SortString: "PaymentRefNum", SortAsc: true },
    { DisplayValue: "Date", Show: true, Value: "DateCreated", SortString: "DateCreated", SortAsc: true },
];

export default function Payables() {
    const [data, setData] = useState([]);
    const [showNew, setShowNew] = useState(false);
    const { showSuccess, SuccessModal } = useSuccessModal();

    async function getData() {
        const result = await fetchWithAuth("list-payables", {});
        setData(result ?? []);
    }

    useEffect(() => { getData(); }, []);

    function handleSuccess() {
        setShowNew(false);
        showSuccess("Payment remitted successfully");
        getData();
    }

    return (
        <>
            {showNew && (
                <NewPayable Close={() => setShowNew(false)} OnSuccess={handleSuccess} />
            )}

            <div className="header">
                <div className="header-actions">
                    <button className="btn-new-tx" type="button" onClick={() => setShowNew(true)}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Payment
                    </button>
                </div>
            </div>

            <Grid
                enableFilters={false}
                JsonObjectList={data}
                headerList={headers}
                SetHeaderList={() => {}}
                Sort={() => {}}
            />

            <SuccessModal />
        </>
    );
}
