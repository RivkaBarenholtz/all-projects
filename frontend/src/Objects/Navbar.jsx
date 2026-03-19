import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getUserInfo } from "../Services/api";

const Navbar = ({setTitle, open, setOpen, user, setUser}) => {
  const [userObjects, setUserObjects] = useState({});
  const [vendor , setVendor] = useState("");
  const location = useLocation();

  const currentPath = location.pathname.toLowerCase();

  const allLinks = [
    { path: "/transactions", label: "Transactions", roles: ["admin", "user", "readonly"] },
    { path: "/customers",    label: "Customers",    roles: ["admin", "user"] },
    { path: "/policies",     label: "Policies",     roles: ["admin", "user"] },
    { path: "/vendors",      label: "Vendors",      roles: ["admin", "user"] },
    { path: "/payables",     label: "Payables",     roles: ["admin", "user"] },
    { path: "/schedules",    label: "Schedules",    roles: ["admin", "user"] },
    { path: "/dashboard",    label: "Dashboard",    roles: ["admin", "user", "readonly"] },
    { path: "/settings",     label: "Users",        roles: ["admin"] },
  ];

  const getActiveClass = (path) => {
    if (currentPath === "/" && path === "/transactions") return "active";
    return currentPath === path.toLowerCase() ? "active" : "";
  };

  useEffect(() => {
    const active = allLinks.find(l =>
      currentPath === l.path.toLowerCase() || (currentPath === "/" && l.path === "/transactions")
    );
    if (active) setTitle(active.label);
  }, [currentPath]);

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
      const vendorParam = new URLSearchParams(window.location.search).get("vendor");
      if (vendorParam) localStorage.setItem("currentVendor", vendorParam);
      const vend =   vendorParam?? localStorage.getItem("currentVendor")?? userObjects[0].VendorId;
      
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
          {allLinks
            .filter(({ roles }) => roles.includes(user?.Role?.toLowerCase() ?? ""))
            .map(({ path, label }) => (
              <NavBarLink key={path} path={path} label={label} />
            ))}
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
