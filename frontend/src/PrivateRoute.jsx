import React, {useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { refreshAccessToken,  isTokenExpired , checkTokens} from "./AuthContext";

function PrivateRoute({children }) {
     checkTokens()
  
    
  
    return <React.Fragment>{children}</React.Fragment>;
}

export default PrivateRoute;
