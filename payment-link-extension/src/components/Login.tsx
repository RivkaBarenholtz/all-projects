// src/components/Login.tsx
import "../index.css";
import { useState } from 'react';
import { cognitoService } from '../services/cognitoService';


interface LoginProps {
  onLoginSuccess?: () => void;
}

export const Login = ({ onLoginSuccess }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await cognitoService.signIn(email, password);
      
      if (result.success) {
        console.log('Login successful!');
        // Call the callback to switch to MainPage
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
 <div style={{  display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '16px' }}>
  <div style={{ maxWidth: '448px', width: '100%', backgroundColor: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
    
    
    <form style={{ marginTop: '32px' }} onSubmit={handleSubmit}>
      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: '4px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginTop: '4px', display: 'block', width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', outline: 'none' }}
            placeholder="you@example.com"
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginTop: '4px', display: 'block', width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', outline: 'none' }}
            placeholder="••••••••"
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '8px 16px', 
          border: 'none', 
          borderRadius: '6px', 
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
          fontSize: '14px', 
          fontWeight: '500', 
          color: 'white', 
          backgroundColor: loading ? '#93c5fd' : '#53aac8',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
          marginTop: '24px'
        }}
        onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
        onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563eb')}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  </div>
</div>
  );
};