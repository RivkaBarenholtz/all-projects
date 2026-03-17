import { useEffect, useState } from "react";
import { fetchWithAuth } from "./Utilities";
import { useSuccessModal } from "./Objects/SuccessModal";
import { Grid } from "./Objects/Grid";
import { NewVendor } from "./Objects/NewVendor";

const headers = [
    { DisplayValue: "Name", Show: true, Value: "Name", SortString: "Name", SortAsc: true },
    { DisplayValue: "Payment Account #", Show: true, Value: "PaymentAccountNumber", SortString: "PaymentAccountNumber", SortAsc: true },
    { DisplayValue: "Payment Routing #", Show: true, Value: "PaymentRoutingNumber", SortString: "PaymentRoutingNumber", SortAsc: true },
    { DisplayValue: "Address", Show: true, Value: "Address", SortString: "Address", SortAsc: true },
    { DisplayValue: "Notes", Show: true, Value: "Notes", SortString: "Notes", SortAsc: true },
    { DisplayValue: "", Show: true, Value: "_EditButton", SortString: null, SortAsc: true },
];

export default function Vendors() {
    const [rawData, setRawData] = useState([]);
    const [showNew, setShowNew] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const { showSuccess, SuccessModal } = useSuccessModal();

    async function getData() {
        const result = await fetchWithAuth("list-customervendors", {});
        setRawData(result ?? []);
    }

    useEffect(() => { getData(); }, []);

    function handleSuccess(msg) {
        setShowNew(false);
        setSelectedVendor(null);
        showSuccess(msg ?? "Saved successfully");
        getData();
    }

    const data = rawData.map(v => ({
        ...v,
        _EditButton: (
            <button
                type="button"
                onClick={e => { e.stopPropagation(); setSelectedVendor(v); }}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#148dc2", fontSize: 16 }}
                title="Edit"
            >
                ✎
            </button>
        ),
    }));

    return (
        <>
            {showNew && (
                <NewVendor Close={() => setShowNew(false)} OnSuccess={() => handleSuccess("Vendor created successfully")} />
            )}
            {selectedVendor && (
                <NewVendor
                    vendor={selectedVendor}
                    Close={() => setSelectedVendor(null)}
                    OnSuccess={() => handleSuccess("Vendor updated successfully")}
                />
            )}

            <div className="header">
                <div className="header-actions">
                    <button className="btn-new-tx" type="button" onClick={() => setShowNew(true)}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Vendor
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
