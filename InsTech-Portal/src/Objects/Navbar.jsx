import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  // Get the current path and normalize it
  const currentPath = location.pathname.toLowerCase();

  const getActiveClass = (path) => {
    if (currentPath === "/" && path === "/dashboard") return "active";
    return currentPath === path.toLowerCase() ? "active" : "";
  };

  return (
    <div>
      <nav className="sidebar" style={styles.nav}>
        <div className="logo-nav">
          <h1>InsureTech</h1>
        </div>

        <ul className="nav-menu">
          <li className="nav-item">
            <Link
              className={`nav-link ${getActiveClass("/dashboard")}`}
              to="/dashboard"
              style={styles.link}
            >
              Dashboard
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className={`nav-link ${getActiveClass("/transactions")}`}
              to="/transactions"
              style={styles.link}
            >
              Transactions
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className={`nav-link ${getActiveClass("/customers")}`}
              to="/customers"
              style={styles.link}
            >
              Customers
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className={`nav-link ${getActiveClass("/schedules")}`}
              to="/schedules"
              style={styles.link}
            >
              Schedules
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className={`nav-link ${getActiveClass("/settings")}`}
              to="/settings"
              style={styles.link}
            >
              Settings
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const styles = {
    
    logo: {
      marginBottom: '2rem',
      fontSize: '1.5rem',
    },
    nav: {
          display: 'block',
          unicodeBidi: 'isolate'
    }
  };
  
export default Navbar;



