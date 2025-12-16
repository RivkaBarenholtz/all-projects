import { useState, useEffect } from "react";
import { useLocation, Routes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Navbar from "./Objects/NavBar";
import Header from "./Header";
import "./App.css";
import Schedules from "./Schedules";
import Transactions from "./Transactions";
import Customers from "./Customers";
import PaymentForm from "./PaymentPage/PaymentForm";
import ThankYouPage from "./PaymentPage/ThankYouPage";
import { Settings } from "./Settings";

function App() {
   const accessToken = localStorage.getItem("idToken");
  const [isAuthenticated, setIsAuthenticated] = useState(!!accessToken);

  const location = useLocation();          // ⬅️ get current location
  const currentPath = location.pathname;   // ⬅️ path like /login, /dashboard, etc.

 
  return (
    <>
      {isAuthenticated && currentPath !== "/pay" && <Navbar />}
      {isAuthenticated && currentPath !== "/pay" && <Header />}

      <div className={`${isAuthenticated && currentPath !== "/pay" ? "main-content" : "main-content-no-auth"}`}>
        <Routes>
          
          <Route path="/pay" element={<PaymentForm isPortal={false} />} />
          <Route path="/thank-you" element={<ThankYouPage />} />

          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/*" element={<PrivateRoute><Transactions /></PrivateRoute>} />
          
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="/schedules" element={<PrivateRoute><Schedules /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        </Routes>
      </div>
    </>
  );
}

export default App;
