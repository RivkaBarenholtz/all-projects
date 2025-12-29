import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getUserInfo } from "../Services/api";

const Navbar = () => {
  const [user, setUser] = useState({});
  const [open, setOpen] = useState(false); // for mobile menu
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
        setUser(userInfo);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => setOpen(false), [location.pathname])

  useEffect (()=>{ 
    if(user.length > 0)
    {
      const vend =   localStorage.getItem("currentVendor")?? user[0].VendorId;
      setVendor(vend);
    }
  }, [user])
  
  


  return (
    <div>
      {/* Hamburger button (only visible on mobile) */}
      <div className="hamburger" onClick={() => setOpen(!open)}>
        <div></div>
        <div></div>
        <div></div>
      </div>

      <nav className={`sidebar ${open ? "open" : ""}`} style={styles.nav}>
        <div className="logo-nav">
          <h1>
            <img
              src="https://insure-tech-vendor-data.s3.us-east-1.amazonaws.com/logos/InsTechLogo.png"
              style={{ width: "200px" }}
            />
          </h1>
        </div>

        <ul className="nav-menu">
          <li className="nav-item">
            <Link
              className={`nav-link ${getActiveClass("/transactions")}`}
              to="/transactions"
            >
              Transactions
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className={`nav-link ${getActiveClass("/customers")}`}
              to="/customers"
            >
              Customers
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className={`nav-link ${getActiveClass("/schedules")}`}
              to="/schedules"
            >
              Schedules
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className={`nav-link ${getActiveClass("/dashboard")}`}
              to="/dashboard"
            >
              Dashboard
            </Link>
          </li>

          { Array.isArray(user) && user?.find(x=> x.VendorId == vendor)?.Role?.toLowerCase() === "admin" && (
            <li className="nav-item">
              <Link
                className={`nav-link ${getActiveClass("/settings")}`}
                to="/settings"
              >
                Settings
              </Link>
            </li>
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
