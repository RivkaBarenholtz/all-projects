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

export default function Login({ setIsAuthenticated }) {

  //const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requireNewPassword, setRequireNewPassword] = useState(false);
  const [cognitoUser, setCognitoUser] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);


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

          setIsAuthenticated(true);

          // <-- now everything is ready
          navigate("/transactions");
        });
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

  const navigate = useNavigate();
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

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return { hasMinLength, hasNumber, hasSymbol };
  };

  const validation = validatePassword(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validation.hasMinLength || !validation.hasNumber || !validation.hasSymbol) {
      setError('Please meet all password requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await handleNewPasswordSubmit(e);
    } catch (err) {
      setError('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (requireNewPassword) {
    return (

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        padding: '16px'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img
              src="https://www.instech360.com/InsureTech360.svg"
              alt="InsureTech 360"
              style={{ height: '80px', margin: '0 auto' }}
            />
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#0f4c75',
            marginBottom: '16px'
          }}>
            UPDATE PASSWORD
          </h2>

          {/* Subtitle */}
          <p style={{
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '15px',
            marginBottom: '32px',
            lineHeight: '1.5'
          }}>
            Welcome! Let's secure your account. Please set a new password to get started.
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '12px 16px',
                borderRadius: '4px',
                marginBottom: '24px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* New Password */}
            <div style={{ marginBottom: '8px' }}>


              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#0891b2',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div style={{
              backgroundColor: '#f3f4f6',
              borderLeft: '3px solid #374151',
              padding: '16px',
              marginBottom: '24px',
              borderRadius: '4px'
            }}>
              <ul style={{
                listStyle: 'disc',
                paddingLeft: '20px',
                margin: 0,
                color: '#6b7280',
                fontSize: '14px',
                lineHeight: '1.8'
              }}>
                <li style={{ color: validation.hasMinLength ? '#10b981' : '#6b7280' }}>
                  At least 8 characters
                </li>
                <li style={{ color: validation.hasNumber ? '#10b981' : '#6b7280' }}>
                  Must include 1 number
                </li>
                <li style={{ color: validation.hasSymbol ? '#10b981' : '#6b7280' }}>
                  Must include 1 symbol (e.g., !@#$%)
                </li>
              </ul>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: loading ? '#d1d5db' : '#e5e7eb',
                color: loading ? '#9ca3af' : '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#d1d5db')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#e5e7eb')}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          <img src="https://www.instech360.com/InsureTech360.svg" style={{ height: "100px" }}></img>
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
          © 2025 InsTech. All rights reserved.
        </div>
      </div>
    </div>
  );
}
