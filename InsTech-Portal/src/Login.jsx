import React, { useState } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails
} from 'amazon-cognito-identity-js';
import { useNavigate } from 'react-router-dom';
import "./Login.css";
import { useAsync } from 'react-select/async';


const poolData = {
  UserPoolId: 'us-east-1_guWlEt63Z',
  ClientId: '7nmt8a8ooc0oq1lcaj70n474ff',     
};

const userPool = new CognitoUserPool(poolData);

export default function Login( {setIsAuthenticated} ) {

  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword]= useState(false);
  const [requireNewPassword, setRequireNewPassword] = useState(false);
  const [cognitoUser, setCognitoUser] = useState(null);
  const [name, setName] = useState('');


  const handleLogin = (e) => {
    e.preventDefault();

    const user = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        setMessage(`Welcome, ${username}!`);
        // tokens available here: result.getIdToken(), result.getAccessToken(), etc.

        const idToken = session.getIdToken().getJwtToken();
        const accessToken = session.getAccessToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();

        console.log(idToken);

        localStorage.setItem('idToken', idToken);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);


        user.getUserAttributes((err, attributes) => {
          if (err) {
            console.error("Error fetching attributes:", err);
            return;
          }

          const attrMap = {};
          attributes.forEach((attr) => {
            attrMap[attr.Name] = attr.Value;
          });
          localStorage.setItem('User', JSON.stringify(attrMap)); 
        }
        )

        setIsAuthenticated(true);
        navigate(`/dashboard`)
      },
      onFailure: (err) => {
        setIsAuthenticated(false);
        setMessage(err.message || 'Login failed');
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        // Cognito requires a new password
        setMessage('New password required, please enter a new password.');
        setRequireNewPassword(true);
        setCognitoUser(user);

        // Remove attributes that cannot be changed by user
        delete userAttributes.email_verified;
        delete userAttributes.phone_number_verified;
      },
    });
  };

  const handleNewPasswordSubmit = (e) => {
    e.preventDefault();
    if (!cognitoUser) {
      setMessage('No user available for new password challenge');
      return;
    }

    // You can pass any required attributes here if needed
    const userAttributes = {
      name: name
    }; // or populate if you want to update

    cognitoUser.completeNewPasswordChallenge(
      newPassword,
      userAttributes,
      {
        onSuccess: (result) => {
          setMessage('Password changed successfully! You are now logged in.');
          setRequireNewPassword(false);
          // tokens available here: result.getIdToken(), etc.
        },
        onFailure: (err) => {
          setMessage(err.message || 'Failed to set new password');
        },
      }
    );
  };

  if (requireNewPassword) {
    return (

      <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          <img src="https://www.instech360.com/InsureTech360.svg" style={{ height: "100px"}}></img>
        </h1>

        <form onSubmit={handleNewPasswordSubmit}>
          <h3>Set a new password</h3>

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <button type="submit">Submit New Password</button>
          <p>{message}</p>
        </form>
      </div>
      </div>
    );
  }

  return (
      <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          <img src="https://www.instech360.com/InsureTech360.svg" style={{ height: "100px"}}></img>
        </h1>
         <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="text"
              placeholder="user@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input password-input"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className='error-div'> {message}</div>

          <button type="submit" className="form-button">
            Sign In
          </button>
        </form>
       
        <div className="login-footer">
          © 2025 Insure Tech. All rights reserved.
        </div>
      </div>
    </div>
  );
}
