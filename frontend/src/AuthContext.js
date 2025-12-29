import {
  CognitoUserPool
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'us-east-1_guWlEt63Z',
  ClientId: '7nmt8a8ooc0oq1lcaj70n474ff',     
};

const userPool = new CognitoUserPool(poolData);

export const refreshSession = () => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      redirectToLogin(); 
    }

    cognitoUser.getSession((err, session) => {
      if (err) {
        reject("Session fetch error: " + err);
        return;
      }

      if (session.isValid()) {
        const token = session.getIdToken().getJwtToken();
        localStorage.setItem('idToken', token);
        resolve(token);
        return;
      }

      const refreshToken = session.getRefreshToken();

      cognitoUser.refreshSession(refreshToken, (err, newSession) => {
        if (err) {
          reject("Refresh failed: " + err);
        } else {
          const newIdToken = newSession.getIdToken().getJwtToken();
          localStorage.setItem('idToken', newIdToken);
          resolve(newIdToken);
        }
      });
    });
  });
};

export const checkTokens = () => {
    const accessToken = localStorage.getItem("idToken");
    const refreshToken = localStorage.getItem('refreshToken');
  
    if (!accessToken || isTokenExpired(accessToken)) {
      if (refreshToken) {
        return  refreshAccessToken(); // Attempt to refresh token
      } else {
        redirectToLogin();
      }
    }
    else
    {
        return accessToken; 
    }
};
  
export const isTokenExpired = (token) => {
  if (!token ||token == "") return true;
  const decoded = JSON.parse(atob(token.split(".")[1]));
  return decoded.exp * 1000 < Date.now();
};
export  const refreshAccessToken = async () => {
  try {
    const accessToken = await refreshSession();

    if (accessToken) {
      localStorage.setItem("idToken", accessToken);
      return accessToken; 
    } else {
      redirectToLogin();
    }
  } 
  catch (error) {
    console.error("Error refreshing access token:", error);
  }
};
const redirectToLogin = () => {
  localStorage.removeItem("idToken");
  window.location.href =process.env.NODE_ENV === 'development' || window.location.hostname === 'pay.instechpay.co' || window.location.hostname === 'portal.instechpay.co'? '/login' : '/app/login'; 
};
  