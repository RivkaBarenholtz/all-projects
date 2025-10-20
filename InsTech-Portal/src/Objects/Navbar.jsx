import React, {useState} from 'react';
import { Link } from 'react-router-dom'; // If using react-router for navigation

const Navbar = () => {
  const [selectedLink, setSelectedLink]= useState("Dashboard");
  
  return (
    <div >
       
        <nav className='sidebar' style={styles.nav}>

           <div className="logo-nav">
                <h1>InsureTech</h1>
            </div>
            <ul className='nav-menu'>
              <li className={`nav-item`}  onFocus={()=>{setSelectedLink("Dashboard")}}>
                  <Link className={`nav-link ${selectedLink=='Dashboard'?'active':''}`} to="/dashboard" style={styles.link}>Dashboard</Link>
              </li>
              <li  className='nav-item'  onFocus={()=>{setSelectedLink("Transactions")}}>
                <Link className={`nav-link ${selectedLink=='Transactions'?'active':''}`} to="/dashboard" style={styles.link}>Transactions</Link>
              </li>
              <li  className={`nav-item`} onFocus={()=>{setSelectedLink("Reports")}}>
                <Link className={`nav-link ${selectedLink=='Reports'?'active':''}`} to="/ReconciliationReport" style={styles.link}>Reports</Link>
              </li>
              <li  className={`nav-item`} onFocus={()=>{setSelectedLink("Schedules")}}>
                <Link className={`nav-link ${selectedLink=='Schedules'?'active':''}`} to="/Schedules" style={styles.link}>Schedules</Link>
              </li>
              <li className={`nav-item`}  onFocus={()=>{setSelectedLink("Settings")}}>
                <Link className={`nav-link ${selectedLink=='Settings'?'active':''} `} to="/settings" style={styles.link}>Settings</Link>
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