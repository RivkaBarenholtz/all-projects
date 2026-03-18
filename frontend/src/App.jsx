import { useState } from "react";
import { useLocation, Routes, Route, useParams } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Navbar from "./Objects/Navbar";
import Header from "./Header";
import "./App.css";
import Schedules from "./Schedules";
import Transactions from "./Transactions";
import Customers from "./Customers";
import PaymentForm from "./PaymentPage/PaymentForm";
import PolicyCheckout from "./PaymentPage/PolicyCheckout";
import ThankYouPage from "./PaymentPage/ThankYouPage";
import { Settings } from "./Settings";
import Policies from "./Pages/Policies";
// import Invoices from "./Pages/Invoices";
import Vendors from "./Vendors";
import Payables from "./Payables";
import SSO from "./SSO";

/* ---------- Context-based layout ---------- */
function ContextLayout({ isAuthenticated, setIsAuthenticated }) {
  const { context } = useParams();
  const location = useLocation();
  const currentPath = location.pathname;
  const [title, setTitle] = useState("Transactions");
  const [user, setUser] = useState({});
  const [open, setOpen] = useState(false); // for mobile menu

  return (
    <>
      {isAuthenticated && (!currentPath.includes("/pay") || currentPath.includes("payables")) && !currentPath.includes("/checkout") && <Navbar setTitle={setTitle} open={open} setOpen={setOpen} user={user} setUser={setUser}/>}

      <div className={isAuthenticated && (!currentPath.includes("/pay") || currentPath.includes("payables")) && !currentPath.includes("/checkout")
        ? "main-content"
        : ""
      }>
        {isAuthenticated && (!currentPath.includes("/pay") || currentPath.includes("payables")) && !currentPath.includes("/checkout") && <Header title={title} openNav={open} setOpenNav={setOpen} />}

        <Routes>
          <Route path="pay" element={<PaymentForm subdomain={context} isPortal={false} />} />
          <Route path="checkout" element={<PolicyCheckout />} />
          <Route path="thank-you" element={<ThankYouPage />} />
          <Route path="login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="sso" element={<SSO />} />

          <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="transactions" element={<PrivateRoute><Transactions user={user} /></PrivateRoute>} />
          <Route path="policies" element={<PrivateRoute><Policies /></PrivateRoute>} />
          {/* <Route path="invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} /> */}

          {(user?.Role?.toLowerCase() === "admin" || user?.Role?.toLowerCase() === "user") &&
          <>
          <Route path="customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="policies" element={<PrivateRoute><Policies /></PrivateRoute>} />
          {/* <Route path="invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} /> */}
          <Route path="schedules" element={<PrivateRoute><Schedules /></PrivateRoute>} />
          <Route path="vendors" element={<PrivateRoute><Vendors /></PrivateRoute>} />
          <Route path="payables" element={<PrivateRoute><Payables /></PrivateRoute>} />
          </>
}
          <Route path="settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

          <Route path="*" element={<PrivateRoute><Transactions user={user} /></PrivateRoute>} />
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
    const location = useLocation();

    const isRoot = location.pathname === "/" || location.pathname === "";

    if(isRoot) {
      window.location.href = "https://portal.instechpay.co";
        return null;
    }

    return (
      <div className="main-content-no-auth">
        <Routes>
          <Route path="/:context/checkout" element={<PolicyCheckout />} />
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
