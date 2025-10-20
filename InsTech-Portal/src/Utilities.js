export const fetchWithAuth = async (url, options = {}) => {
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

    const response = await fetch(`${BaseUrl()}/portal/${url}`, {
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


  export const FormatCurrency=(amt)=>
    {
       return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt)
    }
    
    export const BaseUrl=() =>{
     return import.meta.env.MODE === 'development'
        ? 'https://ins-dev.instechpay.co'
        : window.location.origin;
    }


  const handleUnauthorized = () => {
    localStorage.removeItem("idToken");
    window.location.href = "/login";
  };