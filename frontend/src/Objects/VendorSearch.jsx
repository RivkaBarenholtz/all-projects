import { useEffect, useState } from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { fetchWithAuth } from "../Utilities";
import { Grid } from "./Grid";

const headers = [
    { DisplayValue: "Name", Show: true, Value: "Name", FilterValue: "Name", SortString: "Name", SortAsc: true },
    { DisplayValue: "Payment Account #", Show: true, Value: "PaymentAccountNumber", FilterValue: "PaymentAccountNumber", SortString: "PaymentAccountNumber", SortAsc: true },
    { DisplayValue: "Payment Routing #", Show: true, Value: "PaymentRoutingNumber", FilterValue: "PaymentRoutingNumber", SortString: "PaymentRoutingNumber", SortAsc: true },
    { DisplayValue: "Address", Show: true, Value: "Address", FilterValue: "Address", SortString: "Address", SortAsc: true },
];

export function VendorSearch({ onSelect, onClose }) {
    const [data, setData] = useState([]);
    const [selected, setSelected] = useState(null);
    const [filters, setFilters] = useState({});

    useEffect(() => {
        fetchWithAuth("list-customervendors", {}).then(r => setData(r ?? []));
    }, []);

    return (
        <ConfirmationModal
            confirmButtonText="Select Vendor"
            maxWidth="800px"
            onClose={onClose}
            onConfirm={() => selected && onSelect(selected)}
        >
            <Grid
                filters={filters}
                setFilters={setFilters}
                JsonObjectList={data}
                headerList={headers}
                SetHeaderList={() => {}}
                isSelectable={true}
                selectedItem={selected}
                setSelectedItem={setSelected}
                enableFilters={true}
                Sort={() => {}}
            />
        </ConfirmationModal>
    );
}
