import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
  updateProfile as updateProfileApi,
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth State on App Load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('evcharge_token');
      const storedUser = localStorage.getItem('evcharge_user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse cached user', e);
          }
        }

        try {
          // Verify with backend
          const response = await getCurrentUser();
          if (response.success && response.data?.user) {
            setUser(response.data.user);
            localStorage.setItem(
              'evcharge_user',
              JSON.stringify(response.data.user)
            );
          } else {
            throw new Error('Invalid user payload');
          }
        } catch (error) {
          console.warn('Session verification failed, logging out:', error.message);
          localStorage.removeItem('evcharge_token');
          localStorage.removeItem('evcharge_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Register Function
  const register = async (userData) => {
    try {
      const response = await registerUser(userData);
      if (response.success && response.data) {
        const { user: newUser, token: newToken } = response.data;
        setUser(newUser);
        setToken(newToken);
        localStorage.setItem('evcharge_token', newToken);
        localStorage.setItem('evcharge_user', JSON.stringify(newUser));
        return { success: true, data: response.data };
      }
      return {
        success: false,
        message: response.message || 'Registration failed',
        errors: response.errors || [],
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          'Registration failed. Please try again.',
        errors: error.response?.data?.errors || [],
      };
    }
  };

  // Login Function
  const login = async (credentials) => {
    try {
      const response = await loginUser(credentials);
      if (response.success && response.data) {
        const { user: loggedInUser, token: authToken } = response.data;
        setUser(loggedInUser);
        setToken(authToken);
        localStorage.setItem('evcharge_token', authToken);
        localStorage.setItem('evcharge_user', JSON.stringify(loggedInUser));
        return { success: true, data: response.data };
      }
      return {
        success: false,
        message: response.message || 'Login failed',
        errors: response.errors || [],
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          'Invalid email or password.',
        errors: error.response?.data?.errors || [],
      };
    }
  };

  // Logout Function
  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('evcharge_token');
      localStorage.removeItem('evcharge_user');
      setUser(null);
      setToken(null);
    }
  };

  // Update Profile Function
  const updateProfile = async (profileData) => {
    try {
      const response = await updateProfileApi(profileData);
      if (response.success && response.data?.user) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        localStorage.setItem('evcharge_user', JSON.stringify(updatedUser));
        return { success: true, data: updatedUser };
      }
      return {
        success: false,
        message: response.message || 'Update failed',
        errors: response.errors || [],
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          'Profile update failed.',
        errors: error.response?.data?.errors || [],
      };
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        register,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
