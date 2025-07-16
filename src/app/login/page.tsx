'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setPassword('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#333', margin: 0, fontSize: '1.8rem' }}>
            🔐 RAG System Access
          </h1>
          <p style={{ color: '#666', margin: '0.5rem 0 0 0' }}>
            Please enter the password to access this service
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#555',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '0.8rem',
                border: '2px solid #e1e1e1',
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            {error && (
              <div style={{
                color: '#e74c3c',
                marginTop: '0.5rem',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.8rem',
              background: loading ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Authenticating...' : 'Access Service'}
          </button>
        </form>
      </div>
    </div>
  );
}