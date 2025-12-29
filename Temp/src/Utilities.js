import { refreshSession } from "./AuthContext";

export const fetchWithAuth = async (url, options = {}, isText = false ) => {
  const token = localStorage.getItem('idToken');
  const userEmail = SafeParseJson(localStorage.getItem('User')).email;
  const vendor = localStorage.getItem("currentVendor");
  
  const makeRequest = async (jwtToken, userEmail, vend) => {
    const headers = {
      Authorization: `Bearer ${jwtToken}`,
      'user': userEmail,
      'Vendor': vend, 
      "Content-Type": "application/json",
    };

    const response = await fetch(`${BaseUrl()}/portal-v1/${url}`, {
                method: 'POST',
                body: JSON.stringify(options),
                headers: headers
            });
   

    return response;
  };

  let response = await makeRequest(token, userEmail, vendor);

 if (response.status === 401) {
    try {
      const newToken = await refreshSession();
      response = await makeRequest(newToken, userEmail, vendor);
    } catch (err) {
      console.error("Token refresh failed:", err);
      handleUnauthorized(); // e.g., redirect to login
      return;
    }
  }

    if (!response.ok) {
      const errorText = await response.text(); // optional: get response body
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    if (isText)
      return await response.text();
    // Return parsed response
    return await response.json()
  };

  export const  SafeParseJson= (jsonString)=> {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn("Invalid JSON in localStorage:", e);
    return null;
  }
}

   export const  isValidEmail=(email)=> {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

export const Sort = ( data,  field, ascending = true) =>{
      return data.slice().sort((a, b) => {
         const valA = a[field];
         const valB = b[field];

         if (valA === undefined) return 1;
         if (valB === undefined) return -1;

         if (typeof valA === "string" && typeof valB === "string") {
            return ascending
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
         }

         return ascending ? valA - valB : valB - valA;
      });
      }


  export const FormatCurrency=(amt)=>
    {
       return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt)
    }
    
    export const BaseUrl=() =>{
     return import.meta.env.MODE === 'development'
        ? 'https://ins-dev.instechpay.co'
        : window.location.origin.replace("pay.instechpay.co", "ins-dev.instechpay.co")
        .replace("portal.instechpay.co", "ins-dev.instechpay.co"); 
    }


  export const handleUnauthorized = () => {
     
    localStorage.removeItem("idToken");
    import.meta.env.MODE === 'development' || window.location.hostname === 'portal.instechpay.co' || window.location.hostname === 'pay.instechpay.co' ?
    window.location.href = "/login":
    window.location.href = "/app/login"
    ;
  };