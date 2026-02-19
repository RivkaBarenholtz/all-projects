 import { useState } from "react";
 
 export const ResetPassword = ({ updatePassword, newPassword , setNewPassword, showPassword}) => {
    
    
  
 const [error, setError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);


  
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
      await updatePassword(e);
    } catch (err) {
      setError('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

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
              src="https://insure-tech-vendor-data.s3.us-east-1.amazonaws.com/logos/InsTechLogo.png"
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

            {/* <div style={{ marginBottom: '32px' }}>
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
            </div> */}

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
                backgroundColor: loading ? '#0770f9ff' : 'rgb(4 57 105)',
                color: '#ffffffff' ,
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
    