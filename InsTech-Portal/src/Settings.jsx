import { useState, useEffect } from "react"
import { getUserInfo } from "./Services/api";
import { Grid } from "./Objects/Grid";
export const Settings = ()=>{
    const [users, setUsers] = useState([]);
    const [user , setUser]= useState({});
   useEffect(() => {
       async function fetchUser() {
         try {
           const userInfo = await getUserInfo();
           setUser(userInfo);
         } catch (error) {
           console.error("Error fetching user info:", error);
         }
       }
       fetchUser();
     }, []);

    return <>
        {user.Role=="admin" && <div>
            
        </div>}

    </>
}