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


  return (
    <BrowserRouter>
       {isAuthenticated && <Navbar />}
       {isAuthenticated && <Header  />}
       <div  className={`${isAuthenticated?'main-content':''}`}>
      <Routes>
        <Route path="/login" element={<Login  setIsAuthenticated={setIsAuthenticated} />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute >
              <Dashboard />
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
          path="/ReconciliationReport"
          element={
            <PrivateRoute >
              <ReconciliationReport />
            </PrivateRoute>
          }
        />
        
      </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
