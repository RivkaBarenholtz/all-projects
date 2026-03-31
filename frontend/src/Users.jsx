import { useState, useEffect } from "react"
import { getUserInfo, listUsers, getSubAccounts } from "./Services/api";
import { Grid } from "./Objects/Grid";
import { NewUser } from "./Objects/NewUser";
import { useSuccessModal } from "./Objects/SuccessModal";
import { fetchWithAuth } from "./Utilities";

export const Users = () => {
    const [users, setUsers] = useState([]);
    const [user, setUser] = useState({});
    const [showAddNewUserModal, setShowAddNewUserModal] = useState(false);
    const [subAccounts, setSubAccounts] = useState([]);
    const [editingSubAccount, setEditingSubAccount] = useState(null); // { email, subAccountId }
    const [savingSubAccount, setSavingSubAccount] = useState(false);

    const { showSuccess, SuccessModal } = useSuccessModal();

    useEffect(() => {
        async function fetchUser() {
            const vendor = localStorage.getItem("currentVendor");

            try {
                const userInfo = await getUserInfo();
                const currentUser = userInfo.find(x => x.VendorId == vendor);
                setUser(currentUser);
            } catch (error) {
                console.error("Error fetching user info:", error);
            }
        }
        fetchUser();
        getSubAccounts().then(list => setSubAccounts(list ?? []));
    }, []);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const usersList = await listUsers();
                const newUserList = usersList.map(u => {
                    const isAdmin = u.Role?.toLowerCase() === "admin";
                    const subAccountName = isAdmin ? "" : (subAccounts.find(sa => sa.Id === u.SubAccountId)?.Name ?? "Default Account");
                    const isEditing = editingSubAccount?.email === u.Email;
                    return {
                        ...u,
                        SubAccountName: subAccountName,
                        className: u.Disabled ? "disabled-row" : "",
                        EditSubAccount: isAdmin ? <></> : isEditing ? (
                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                <select
                                    value={editingSubAccount.subAccountId}
                                    onChange={e => setEditingSubAccount(prev => ({ ...prev, subAccountId: e.target.value }))}
                                    style={{ padding: "2px 4px" }}
                                >
                                    {subAccounts.map(sa => (
                                        <option key={sa.Id} value={sa.Id}>{sa.Name}</option>
                                    ))}
                                </select>
                                <button className="btn-new-tx" style={{ padding: "2px 8px" }} disabled={savingSubAccount} onClick={() => saveSubAccount(u)}>
                                    {savingSubAccount ? "Saving..." : "Save"}
                                </button>
                                <button style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }} onClick={() => setEditingSubAccount(null)}>Cancel</button>
                            </div>
                        ) : (
                            <button style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#6b7280" }} onClick={() => setEditingSubAccount({ email: u.Email, subAccountId: u.SubAccountId ?? "" })} title="Edit sub-account">✏️</button>
                        ),
                        Action: !u.Disabled && u.Role.toLowerCase() == "user" ?
                            <button style={{ padding: ".25rem" }} className="btn btn-secondary" onClick={async () => {
                                await fetchWithAuth("update-user", { ...u, Disabled: true });
                                fetchUsers();
                            }}>
                                Disable
                            </button> : u.Disabled ? <button style={{
                                padding: ".25rem", background: "#e7e7e7",
                                border: "1px solid gray"
                            }} className="btn btn-secondary" onClick={async () => {
                                await fetchWithAuth("update-user", { ...u, Disabled: false });
                                fetchUsers();
                            }}>ReEnable</button> : <></>
                    };
                });
                setUsers(newUserList);
            }
            catch (err) {
                console.error("Error fetching users:", err);
            }
        }
        if (user) fetchUsers();
    }, [user, subAccounts, editingSubAccount, savingSubAccount])

    const saveSubAccount = async (u) => {
        setSavingSubAccount(true);
        await fetchWithAuth("update-user", { ...u, SubAccountId: editingSubAccount.subAccountId || null });
        setEditingSubAccount(null);
        setSavingSubAccount(false);
        showSuccess("Sub-account updated");
    };


    return <>
        {user?.Role?.toLowerCase() === "admin" && <div>

            {showAddNewUserModal && <NewUser CloseNewUser={() => setShowAddNewUserModal(false)} OnSuccess={() => {
                setShowAddNewUserModal(false);
                showSuccess("User created successfully");
            }} />}

            <div style={{ maxWidth: "970px" }}>
                <div style={{
                    width: "100%",
                    paddingBottom: "1rem",
                    display: "flex",
                    justifyContent: "end"
                }}>
                    <button className="btn-new-tx" onClick={() => setShowAddNewUserModal(true)}>Add New User</button>
                </div>
                <Grid enableFilters={false} hideColumnDropdown={true} headerList={[
                    { DisplayValue: "Email", Show: true, Value: "Email" },
                    { DisplayValue: "Full Name", Show: true, Value: "FullName" },
                    { DisplayValue: "Role", Show: true, Value: "Role" },
                    { DisplayValue: "Sub-Account", Show: true, Value: "SubAccountName" },
                    { DisplayValue: "", Show: true, Value: "EditSubAccount" },
                    { DisplayValue: "", Show: true, Value: "Action" },
                ]} JsonObjectList={users}
                />
            </div>
        </div>}
        <SuccessModal />
    </>
}
