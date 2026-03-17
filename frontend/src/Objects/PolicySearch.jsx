import { useEffect, useState } from "react";
import { ConfirmationModal } from "./ConfimationModal";
import { fetchWithAuth, FormatCurrency } from "../Utilities";
import { Grid } from "./Grid";

const BASE_HEADERS = [
    { DisplayValue: "Policy Code",   Show: true, Value: "PolicyCode",      FilterValue: "PolicyCode",      SortString: "PolicyCode",      SortAsc: true  },
    { DisplayValue: "Insured",       Show: true, Value: "InsuredDisplay",  FilterValue: "InsuredDisplay",  SortString: "InsuredDisplay",  SortAsc: true  },
    { DisplayValue: "Carrier",       Show: true, Value: "CarrierName",     FilterValue: "CarrierName",     SortString: "CarrierName",     SortAsc: true  },
    { DisplayValue: "Premium",       Show: true, Value: "AmountString",    FilterValue: "AmountString",    SortString: "Amount",          SortAsc: false },
    { DisplayValue: "Policy Start",  Show: true, Value: "StartDisplay",    FilterValue: "StartDisplay",    SortString: "PolicyStartDate", SortAsc: false },
    { DisplayValue: "Description",   Show: true, Value: "PolicyDescription", FilterValue: "PolicyDescription", SortString: "PolicyDescription", SortAsc: true },
];

export function PolicySearch({ onSelect, onClose }) {
    const [data,     setData]     = useState([]);
    const [headers,  setHeaders]  = useState(BASE_HEADERS);
    const [selected, setSelected] = useState(null);
    const [filters,  setFilters]  = useState({});

    useEffect(() => {
        fetchWithAuth("get-policy-list", {}).then(raw => {
            const formatted = (raw ?? []).map(p => ({
                ...p,
                InsuredDisplay: `${p.Customer?.BillFirstName ?? ""} ${p.Customer?.BillLastName ?? ""}`.trim() || p.Customer?.BillCompany || "",
                AmountString:   FormatCurrency(p.Amount),
                StartDisplay:   p.PolicyStartDate ? new Date(p.PolicyStartDate).toLocaleDateString("en-US") : "",
            }));
            setData(formatted);
        });
    }, []);

    return (
        <ConfirmationModal
            confirmButtonText="Select Policy"
            maxWidth="900px"
            onClose={onClose}
            onConfirm={() => selected && onSelect(selected)}
        >
            <Grid
                filters={filters}
                setFilters={setFilters}
                JsonObjectList={data}
                headerList={headers}
                SetHeaderList={setHeaders}
                isSelectable={true}
                selectedItem={selected}
                setSelectedItem={setSelected}
                enableFilters={true}
                Sort={() => {}}
            />
        </ConfirmationModal>
    );
}
