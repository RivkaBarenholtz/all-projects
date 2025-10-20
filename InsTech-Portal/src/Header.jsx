import { useState, useEffect, useRef } from "react";
import { fetchWithAuth , SafeParseJson} from "./Utilities";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user , setUser ]= useState({})
  const [availableVendors , setAvailableVendors ]= useState([]);
  const [selectedVendor, setSelectedVendor ] = useState();
  const menuRef = useRef(null);

//   // Example user data
//   const user = {
//     name: "Rivka",
//     account: "Premium Account",
//     attributes: {
//       email: "rivka@example.com",
//       role: "Admin",
//       memberSince: "2024-01-15",
//     },
//   };

  const toggleMenu = () => setOpen(!open);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  useEffect (()=> {
        const userJsonString = localStorage.getItem("User");
        const userItem = userJsonString? SafeParseJson(userJsonString): null;
        if (userItem) {
            setUser(userItem);
        }
  }, [])
  useEffect(()=> {

    async function getVendors (){
    const vendors = await fetchWithAuth('get-available-vendors',{})
    setAvailableVendors(vendors);
        if(!localStorage.getItem("currentVendor"))
        {
            setSelected(vendors[0].Id)
        }
        else 
        {
            setSelectedVendor(localStorage.getItem("currentVendor"));
        }
    }
    getVendors(); 
  }, [])

  const setSelected = (vendorid)=> {
    setSelectedVendor (vendorid);
    localStorage.setItem("currentVendor", vendorid) ;
    window.location.reload(false);
  }

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "12px 24px",
        borderBottom: "1px solid #ddd",
        background: "#f9f9f9",
      }}
    >
      <div style={{ position: "relative" }} ref={menuRef}>
        <button
          onClick={toggleMenu}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {user?.name}
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "8px",
              marginTop: "4px",
              minWidth: "200px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 1000,
            }}
          >
            {availableVendors.map((vendor) => (
              <div key={vendor.Id} style={{ padding: "4px 0" }}>
                <strong>{vendor.CardknoxAccountCode}</strong> 
                <input
                    type="radio"
                    name="choice"
                    value={vendor.Id}
                    checked={selectedVendor == vendor.Id}
                    onChange={(e) => setSelected(e.target.value)}
                    
                />
          
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
