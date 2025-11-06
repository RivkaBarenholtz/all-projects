import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Navbar from "./Objects/NavBar";
import ReconciliationReport from "./ReconciliationReport";
import Header  from "./Header";
import "./App.css"
import Schedules from "./Schedules";
import Transactions from "./Transactions";
import Customers from "./Customers";
import PaymentForm from "./PaymentPage/PaymentForm";
import ThankYouPage from "./PaymentPage/ThankYouPage";
import { Settings } from "./Settings";
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const accessToken = localStorage.getItem("idToken");
    if(!accessToken )
    {
      setIsAuthenticated(false);
    }
    else
    {
      setIsAuthenticated(true);
    }
     
  }, []);

 const basename = process.env.NODE_ENV === 'development' ? '/' : '/app';



  return (
    <BrowserRouter basename={basename}>
       {isAuthenticated && <Navbar />}
       {isAuthenticated && <Header  />}
       <div  className={`${isAuthenticated?'main-content':'main-content-no-auth'}`}>
      <Routes>
        <Route path="/*" element={<PrivateRoute >
              <Dashboard />
            </PrivateRoute>} />

        <Route 
          path="/pay" 
          element ={<PaymentForm isPortal={false}/>}
        />
          <Route 
          path="/thank-you" 
          element ={<ThankYouPage />}
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute >
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <PrivateRoute >
              <Transactions />
            </PrivateRoute>
          }
        />
         <Route
          path="/customers"
          element={
            <PrivateRoute >
              <Customers />
            </PrivateRoute>
          }
        />
        <Route
          path="/schedules"
          element={
            <PrivateRoute >
              <Schedules />
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute >
              <Settings />
            </PrivateRoute>
          }
        />
        
      </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
