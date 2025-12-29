import React, {useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { refreshAccessToken,  isTokenExpired , checkTokens} from "./AuthContext";

function PrivateRoute({children }) {
    const token = checkTokens();
  
    useEffect(() => {
      if (!token || isTokenExpired(token)) {
        refreshAccessToken();
      }
    }, []);
  
    return <React.Fragment>{children}</React.Fragment>;
}

export default PrivateRoute;
