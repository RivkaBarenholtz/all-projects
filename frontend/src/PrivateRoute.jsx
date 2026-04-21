import React, {useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { checkTokens} from "./AuthContext";

function PrivateRoute({children }) {


    const a =   checkTokens()
    if (!a )  return null; 
  
    
  
    return <React.Fragment>{children}</React.Fragment>;
}

export default PrivateRoute;
