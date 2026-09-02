import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentSession,
  handleOAuthRedirectSession,
  getGoogleAuthUrl,
  registerUser,
  authenticateUser,
  destroySession,
  getInitials,
  checkUserExists,
  findMatchingEmails,
  requestPasswordResetOTP,
  resendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPasswordWithToken,
  validatePasswordRequirements
} from '../services/authService';

const AuthContext = createContext({
  currentUser: null,
  isAuthenticated: false,
  isAuthModalOpen: false,
  authModalMode: 'initial',
  oauthError: null,
  clearOAuthError: () => {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  getInitials: () => 'U',
  getGoogleAuthUrl: async () => {},
  checkUserExists: async () => false,
  findMatchingEmails: async () => [],
  requestPasswordResetOTP: async () => {},
  resendPasswordResetOTP: async () => {},
  verifyPasswordResetOTP: async () => {},
  resetPasswordWithToken: async () => {},
  validatePasswordRequirements: () => ({})
});

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('initial'); // 'initial' | 'password' | 'signup' | 'forgot_email' | 'verify_otp' | 'create_new_password' | 'reset_success'
  const [oauthError, setOauthError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. Check if user just completed Google OAuth callback redirect
    const { user: oauthUser, error: oauthErr } = handleOAuthRedirectSession();
    if (oauthUser) {
      setCurrentUser(oauthUser);
    } else if (oauthErr) {
      setOauthError(oauthErr);
      setAuthModalMode('initial');
      setIsAuthModalOpen(true);
    } else {
      // 2. Check existing session
      const existing = getCurrentSession();
      if (existing) {
        setCurrentUser(existing);
      }
    }
    setIsInitialized(true);
  }, []);

  const openAuthModal = (mode = 'initial') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setOauthError(null);
  };

  const clearOAuthError = () => {
    setOauthError(null);
  };

  const login = async (email, password) => {
    const user = await authenticateUser(email, password);
    setCurrentUser(user);
    closeAuthModal();
    return user;
  };

  const signup = async (userData) => {
    const user = await registerUser(userData);
    setCurrentUser(user);
    closeAuthModal();
    return user;
  };

  const logout = () => {
    destroySession();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAuthModalOpen,
        authModalMode,
        oauthError,
        clearOAuthError,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        login,
        signup,
        logout,
        getInitials,
        isInitialized,
        getGoogleAuthUrl,
        checkUserExists,
        findMatchingEmails,
        requestPasswordResetOTP,
        resendPasswordResetOTP,
        verifyPasswordResetOTP,
        resetPasswordWithToken,
        validatePasswordRequirements
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
