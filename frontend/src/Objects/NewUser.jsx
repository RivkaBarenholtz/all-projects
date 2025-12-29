import { ConfirmationModal } from "./ConfimationModal";
import { createUser } from "../Services/api";
import { useState } from "react";
import { isValidEmail } from "../Utilities";

export const NewUser = ({ CloseNewUser, OnSuccess }) => {

    const [email, setEmail] = useState("");
    const [role, setRole] = useState("user");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

 

    const Validate = () => {
        if (!email || !isValidEmail(email)) {
            setError("Please enter a valid email.");
            return false;
        }
        if (!fullName) {
            setError("Please enter the user's name.");
            return false;
        }
        return true;
    }


    const CreateUser = async () => {
        setLoading(true);
        setError("");
        try {
            if (!Validate()) {
                setLoading(false);
                return;
            }

            await createUser({ Email: email, Role: role, FullName: fullName, VendorId : localStorage.getItem("currentVendor") });
            OnSuccess();
            CloseNewUser();
        } catch (err) {
            setError(err.message || "Error creating user");
        }
        setLoading(false);
    };

    return <ConfirmationModal confirmButtonText={"Create User"} onClose={CloseNewUser} onConfirm={CreateUser} loading={loading} >
        <div>
            <h2>Create New User</h2>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
                <label>Email:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
                <label>Full Name:</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="form-group">
                <label>Role:</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
        </div>
    </ConfirmationModal>
}    
