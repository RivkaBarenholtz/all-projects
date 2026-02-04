import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getUserInfo } from "../Services/api";

const Navbar = ({setTitle, open, setOpen, user, setUser}) => {
  const [userObjects, setUserObjects] = useState({});
  const [vendor , setVendor] = useState("");
  const location = useLocation();

  const currentPath = location.pathname.toLowerCase();

  const getActiveClass = (path) => {
    if (currentPath === "/" && path === "/transactions") return "active";
    return currentPath === path.toLowerCase() ? "active" : "";
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const userInfo = await getUserInfo();
        setUserObjects(userInfo);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => setOpen(false), [location.pathname])

  useEffect (()=>{ 
    if(userObjects.length > 0)
    {
      const vend =   localStorage.getItem("currentVendor")?? userObjects[0].VendorId;
      
      setVendor(vend);

      const currentUser = userObjects.find(x => x.VendorId == vend);
      if (!currentUser)
      {
        setUser(userObjects[0]);
        localStorage.setItem("currentVendor", userObjects[0].VendorId);
        setVendor( userObjects[0].VendorId);
        return; 
      }
      setUser(currentUser);
    }
  }, [userObjects])


    const NavBarLink= ({path, label})=>{
     return  <li className="nav-item">
       <Link
              className={`nav-link ${getActiveClass(path)}`}
              to={path}
              onClick={() => setTitle(label)}
            >
              {label}
      </Link>
      </li>
    }


  return (
   
    <div>
    

      <nav className={`sidebar ${open ? "open" : ""}`} style={styles.nav}>
        <div className="logo-nav">
          <h1>
            <img
              src="https://insure-tech-vendor-data.s3.us-east-1.amazonaws.com/logos/InsTechLogo.png"
              style={{ width: "140px" }}
            />
          </h1>
        </div>

        <ul className="nav-menu">
          <NavBarLink path="/transactions" label="Transactions" />

          {(user?.Role?.toLowerCase() === "admin"|| user?.Role?.toLowerCase() === "user" ) && (
           <>

            <NavBarLink path="/customers" label="Customers" />
          
            <NavBarLink path="/schedules" label="Schedules" />

            
           </>
          )}
          <NavBarLink path="/dashboard" label="Dashboard" />

          { (user?.Role?.toLowerCase() === "admin" ) && (
            <NavBarLink path="/settings" label="Users" />
          )}
        </ul>
      </nav>
    </div>
  );
};

const styles = {
  nav: {
    display: "block",
    unicodeBidi: "isolate",
  },
};

export default Navbar;
