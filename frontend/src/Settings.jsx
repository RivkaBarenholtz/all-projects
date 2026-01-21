import { useState, useEffect } from "react"
import { getUserInfo, listUsers } from "./Services/api";
import { Grid } from "./Objects/Grid";
import { NewUser } from "./Objects/NewUser";
import { useSuccessModal } from "./Objects/SuccessModal";
import { fetchWithAuth } from "./Utilities";

export const Settings = () => {
    const [users, setUsers] = useState([]);
    const [user, setUser] = useState({});
    const [showAddNewUserModal, setShowAddNewUserModal] = useState(false);

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
    }, []);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const usersList = await listUsers();
                const newUserList = usersList.map(u => {
                    return {
                        ...u,
                        className: u.Disabled ? "disabled-row" : "",
                        Action: !u.Disabled && u.Role.toLowerCase() == "user" ?
                            <button style={{ padding: ".25rem" }} className="btn btn-secondary" onClick={async () => {
                                await fetchWithAuth("update-user", { ...u, Disabled: true });
                                // Refresh user list
                                fetchUsers();

                            }}>
                                Disable
                            </button> : u.Disabled ? <button style={{
                                padding: ".25rem", background: "#e7e7e7",
                                border: "1px solid gray"
                            }} className="btn btn-secondary" onClick={async () => {
                                await fetchWithAuth("update-user", { ...u, Disabled: false });
                                // Refresh user list
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
    }
        , [user])


    return <>
        {user?.Role?.toLowerCase() === "admin" && <div>

            {showAddNewUserModal && <NewUser CloseNewUser={() => setShowAddNewUserModal(false)} OnSuccess={() => {
                setShowAddNewUserModal(false);
                showSuccess("User created successfully");
                // Refresh user list

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
                <Grid enableFilters={false}  hideColumnDropdown={true} headerList={[
                    { DisplayValue: "Email", Show: true, Value: "Email" },
                    { DisplayValue: "Full Name", Show: true, Value: "FullName" },
                    { DisplayValue: "Role", Show: true, Value: "Role" },
                    { DisplayValue: "", Show: true, Value: "Action" },
                ]} JsonObjectList={users}
                />
            </div>
        </div>}
        <SuccessModal />
    </>
}