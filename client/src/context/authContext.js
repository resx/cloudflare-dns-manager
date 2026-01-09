import React, { createContext, useState, useContext, useEffect } from 'react';
import { registerLogoutCallback } from '../services/apiClient.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forceKeyChange, setForceKeyChange] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('tokenExpiresAt');

    // Check if token exists and is not expired
    if (token && expiresAt) {
      const isExpired = Date.now() >= parseInt(expiresAt);

      if (isExpired) {
        // Token expired, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiresAt');
      } else {
        try {
          const userData = JSON.parse(localStorage.getItem('user'));
          setUser(userData);
          setForceKeyChange(userData.forceKeyChange || false);
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenExpiresAt');
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (loginKey) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loginKey }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and calculate expiration time (24 hours from now)
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours in milliseconds

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('tokenExpiresAt', expiresAt.toString());

        setUser(data.user);
        setForceKeyChange(data.user.forceKeyChange || false);
        return { success: true, forceKeyChange: data.user.forceKeyChange || false };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    const token = localStorage.getItem('token');

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');
    setUser(null);
    setForceKeyChange(false);

    // Notify server about logout
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => { });
    }
  };

  // Register logout callback with apiClient
  useEffect(() => {
    registerLogoutCallback(logout);
  }, []);

  // Periodically check if token is expired (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      const expiresAt = localStorage.getItem('tokenExpiresAt');
      if (expiresAt && Date.now() >= parseInt(expiresAt)) {
        logout();
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, []);

  const value = {
    user,
    login,
    logout,
    loading,
    forceKeyChange,
    setForceKeyChange // Expose setter for modal to update
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};