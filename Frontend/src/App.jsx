import { useState } from "react";
import { useLocation, Routes, Route, useParams } from "react-router-dom";
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

/* ---------- Context-based layout ---------- */
function ContextLayout({ isAuthenticated, setIsAuthenticated }) {
  const { context } = useParams();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      {isAuthenticated && !currentPath.includes("/pay") && <Navbar />}
      {isAuthenticated && !currentPath.includes("/pay") && <Header />}

      <div className={isAuthenticated && !currentPath.includes("/pay")
        ? "main-content"
        : "main-content-no-auth"
      }>
        <Routes>
          <Route path="pay" element={<PaymentForm subdomain={context} isPortal={false} />} />
          <Route path="thank-you" element={<ThankYouPage />} />
          <Route path="login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />

          <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
          <Route path="customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="schedules" element={<PrivateRoute><Schedules /></PrivateRoute>} />
          <Route path="settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

          <Route path="*" element={<PrivateRoute><Transactions /></PrivateRoute>} />
        </Routes>
      </div>
    </>
  );
}

/* ---------- Main App ---------- */
function App() {
  const accessToken = localStorage.getItem("idToken");
  const [isAuthenticated, setIsAuthenticated] = useState(!!accessToken);
 

  /* Payment-only subdomain */
  if (window.location.hostname === "pay.instechpay.co") {
    return (
      <div className="main-content-no-auth">
        <Routes>
          <Route path="/:context" element={<PaymentForm isPortal={false}  />} />
          <Route path="/*" element={<PaymentForm isPortal={false}  />} />
        </Routes>
      </div>
    );
  }

  return (
    <Routes>
      {/* requires first path segment */}
      <Route
        path="/*"
        element={
          <ContextLayout
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
          />
        }
      />

      {/* root with no context → 404
      <Route path="/" element={<div>404 – Not Found</div>} />
      <Route path="*" element={<div>404 – Not Found</div>} /> */}
    </Routes>
  );
}

export default App;
