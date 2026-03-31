import { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
// import { fetchWithAuth } from "./Utilities";
import { useSuccessModal } from "./Objects/SuccessModal";
import { getSubAccounts, createSubAccount, updateSubAccount, getEmailAssignments, saveEmailAssignment, deleteEmailAssignment } from "./Services/api";

export const Settings = () => {
    // const [epicConfig, setEpicConfig] = useState(null);
    // const [syncing, setSyncing] = useState(false);
    const [subAccounts, setSubAccounts] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [savingIndex, setSavingIndex] = useState(null);
    const [emailAssignments, setEmailAssignments] = useState([]);
    const [editingEmailIndices, setEditingEmailIndices] = useState(new Set());
    const [savingEmails, setSavingEmails] = useState(false);
    const [emailErrorIndex, setEmailErrorIndex] = useState(null);

    const { showSuccess, SuccessModal } = useSuccessModal();

    useEffect(() => {
        getSubAccounts().then(list => setSubAccounts(list));
        getEmailAssignments().then(list => setEmailAssignments(list ?? []));
    }, []);

    // const syncEpicConfig = async () => {
    //     setSyncing(true);
    //     const config = await fetchWithAuth("sync-epic-agency-config", {});
    //     setEpicConfig(config);
    //     setSyncing(false);
    //     showSuccess("Epic configuration synced successfully");
    // };

    // const isInitialized = epicConfig?.Agencies?.length > 0 || epicConfig?.PolicyTypes?.length > 0;

    const addRow = () => {
        const newIndex = subAccounts.length;
        setSubAccounts(prev => [...prev, { Id: "", Name: "", CardknoxApiKey: "", IsDefault: false }]);
        setEditingIndex(newIndex);
    };

    const updateRow = (index, field, value) => {
        setSubAccounts(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
    };

    const saveRow = async (index) => {
        setSavingIndex(index);
        try {
            const row = subAccounts[index];
            const isNew = !row._isGlobalAccount && !row.Id;
            const result = isNew ? await createSubAccount(row) : await updateSubAccount(row);
            if (result?.id) {
                setSubAccounts(prev => prev.map((r, i) => i === index ? { ...r, Id: result.id } : r));
            }
            setEditingIndex(null);
            showSuccess("Sub-account saved");
        } catch (err) {
            console.error("Error saving sub-account:", err);
        }
        setSavingIndex(null);
    };

    const addEmailRow = () => {
        const newIndex = emailAssignments.length;
        setEmailAssignments(prev => [...prev, { Id: "", CsrEmail: "", SubAccountId: "" }]);
        setEditingEmailIndices(prev => new Set([...prev, newIndex]));
    };

    const updateEmailRow = (index, field, value) => {
        setEmailAssignments(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
    };

    const cancelEmailRow = (index, row) => {
        if (!row.Id) setEmailAssignments(prev => prev.filter((_, i) => i !== index));
        setEditingEmailIndices(prev => { const next = new Set(prev); next.delete(index); return next; });
    };

    const saveAllEmailRows = async () => {
        const editingRows = emailAssignments.filter((_, i) => editingEmailIndices.has(i));
        for (let i = 0; i < emailAssignments.length; i++) {
            if (!editingEmailIndices.has(i)) continue;
            const row = emailAssignments[i];
            if (!row.CsrEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.CsrEmail)) {
                setEmailErrorIndex(i);
                return;
            }
        }
        setEmailErrorIndex(null);
        setSavingEmails(true);
        try {
            const updated = [...emailAssignments];
            for (let i = 0; i < updated.length; i++) {
                if (!editingEmailIndices.has(i)) continue;
                const result = await saveEmailAssignment(updated[i]);
                if (result?.id) updated[i] = { ...updated[i], Id: result.id };
            }
            setEmailAssignments(updated);
            setEditingEmailIndices(new Set());
            showSuccess("Email assignments saved");
        } catch (err) {
            console.error("Error saving email assignments:", err);
        }
        setSavingEmails(false);
    };

    const deleteEmailRow = async (index) => {
        const row = emailAssignments[index];
        if (row.Id) await deleteEmailAssignment(row);
        setEmailAssignments(prev => prev.filter((_, i) => i !== index));
        setEditingEmailIndices(prev => { const next = new Set(prev); next.delete(index); return next; });
    };

    return <>
        <div style={{ maxWidth: "970px" }}>
            {/* Epic Configuration - not part of this feature
            <section style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Epic Configuration</h3>
                        {epicConfig && isInitialized && (
                            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
                                {epicConfig.Agencies?.length ?? 0} {epicConfig.Agencies?.length === 1 ? "agency" : "agencies"} &middot;&nbsp;
                                {epicConfig.PolicyTypes?.length ?? 0} policy {epicConfig.PolicyTypes?.length === 1 ? "type" : "types"} &middot;&nbsp;
                                {epicConfig.LineStatuses?.length ?? 0} line {epicConfig.LineStatuses?.length === 1 ? "status" : "statuses"}
                            </p>
                        )}
                        {epicConfig && !isInitialized && (
                            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#e57373" }}>Not yet initialized</p>
                        )}
                    </div>
                    <button className="btn-new-tx" onClick={syncEpicConfig} disabled={syncing}>
                        {syncing ? "Syncing..." : isInitialized ? "Re-sync from Epic" : "Initialize from Epic"}
                    </button>
                </div>
            </section>
            */}

            <section style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                    <h3 style={{ margin: 0 }}>Sub-Accounts</h3>
                    <button className="btn-new-tx" onClick={addRow}>+ Add</button>
                </div>
                {subAccounts.length > 0 && (
                    <div className="table-wrapper-main" style={{ marginTop: "1rem" }}>
                        <div className="table-wrapper">
                            <table className="transactions-table">
                                <thead>
                                    <tr className="header-row">
                                        <th>Name</th>
                                        <th>API Key</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subAccounts.map((row, i) => {
                                        const isEditing = editingIndex === i;
                                        return (
                                            <tr key={i} className="data-row">
                                                <td className="data-cell">
                                                    {isEditing
                                                        ? <input
                                                            type="text"
                                                            value={row.Name}
                                                            onChange={e => updateRow(i, "Name", e.target.value)}
                                                            style={{ width: "100%", padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4 }}
                                                        />
                                                        : <span>{row.Name}</span>
                                                    }
                                                </td>
                                                <td className="data-cell">
                                                    {isEditing
                                                        ? <input
                                                            type="password"
                                                            value={row.CardknoxApiKey ?? ""}
                                                            onChange={e => updateRow(i, "CardknoxApiKey", e.target.value)}
                                                            placeholder={row.CardknoxApiKeySecretName ? "••••••••" : ""}
                                                            style={{ width: "100%", padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4 }}
                                                        />
                                                        : <span>{row.CardknoxApiKeySecretName ? "••••••••" : ""}</span>
                                                    }
                                                </td>
                                                <td className="data-cell">
                                                    {isEditing ? (
                                                        <button
                                                            className="btn-new-tx"
                                                            style={{ padding: "4px 12px" }}
                                                            onClick={() => saveRow(i)}
                                                            disabled={savingIndex === i}
                                                        >
                                                            {savingIndex === i ? "Saving..." : "Save"}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#6b7280" }}
                                                            onClick={() => setEditingIndex(i)}
                                                            title="Edit"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
            <section style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid #e5e7eb" }}>
                    <h3 style={{ margin: 0 }}>Email Assignments</h3>
                    <button className="btn-new-tx" onClick={addEmailRow}>+ Add</button>
                </div>
                {emailAssignments.length > 0 && (
                    <div className="table-wrapper-main" style={{ marginTop: "1rem" }}>
                        <div className="table-wrapper">
                            <table className="transactions-table">
                                <thead>
                                    <tr className="header-row">
                                        <th>Email</th>
                                        <th>Sub-Account</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {emailAssignments.map((row, i) => {
                                        const isEditing = editingEmailIndices.has(i);
                                        return (
                                            <tr key={i} className="data-row">
                                                <td className="data-cell">
                                                    {isEditing
                                                        ? <>
                                                            <input
                                                                type="email"
                                                                value={row.CsrEmail}
                                                                onChange={e => { updateEmailRow(i, "CsrEmail", e.target.value); setEmailErrorIndex(null); }}
                                                                style={{ width: "100%", padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4 }}
                                                            />
                                                            {emailErrorIndex === i && <div className="toast show" style={{ top: 0 }}>Invalid email.</div>}
                                                        </>
                                                        : <span>{row.CsrEmail}</span>
                                                    }
                                                </td>
                                                <td className="data-cell">
                                                    {isEditing
                                                        ? <select
                                                            value={row.SubAccountId}
                                                            onChange={e => updateEmailRow(i, "SubAccountId", e.target.value)}
                                                            style={{ width: "100%", padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4 }}
                                                        >
                                                            {subAccounts.map(sa => (
                                                                <option key={sa.Id} value={sa.Id}>{sa.Name}</option>
                                                            ))}
                                                        </select>
                                                        : <span>{subAccounts.find(sa => sa.Id === row.SubAccountId)?.Name ?? "Default Account"}</span>
                                                    }
                                                </td>
                                                <td className="data-cell">
                                                    <div style={{ display: "flex", gap: "4px" }}>
                                                        {isEditing
                                                            ? <button
                                                                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#6b7280", fontSize: 12 }}
                                                                onClick={() => cancelEmailRow(i, row)}
                                                            >
                                                                Cancel
                                                            </button>
                                                            : <>
                                                                <button
                                                                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#6b7280" }}
                                                                    onClick={() => setEditingEmailIndices(prev => new Set([...prev, i]))}
                                                                    title="Edit"
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button
                                                                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#e57373" }}
                                                                    onClick={() => deleteEmailRow(i)}
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        }
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {editingEmailIndices.size > 0 && (
                    <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                        <button className="btn-new-tx" onClick={saveAllEmailRows} disabled={savingEmails}>
                            {savingEmails ? "Saving..." : `Save ${editingEmailIndices.size} row${editingEmailIndices.size !== 1 ? "s" : ""}`}
                        </button>
                    </div>
                )}
            </section>
        </div>
        <SuccessModal />
    </>;
};
