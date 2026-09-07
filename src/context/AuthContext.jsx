import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  getCurrentSession,
  createActiveSession,
  destroySession,
  fetchCurrentUserProfile,
  handleOAuthRedirectSession,
  getGoogleAuthUrl,
  registerUser,
  authenticateUser,
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
    let isMounted = true;

    async function initAuth() {
      try {
        // 1. Check if user just completed Google OAuth callback redirect
        const { user: oauthUser, error: oauthErr } = handleOAuthRedirectSession();
        if (oauthUser && isMounted) {
          setCurrentUser(oauthUser);
          setIsInitialized(true);
          return;
        } else if (oauthErr && isMounted) {
          setOauthError(oauthErr);
          setAuthModalMode('initial');
          setIsAuthModalOpen(true);
          setIsInitialized(true);
          return;
        }

        // 2. Query Supabase browser session as Primary Source of Truth
        const { data: { session } = {} } = await supabase.auth.getSession();

        if (session?.access_token) {
          // Validate session with /api/auth/me
          const verifiedProfile = await fetchCurrentUserProfile(session.access_token);
          if (verifiedProfile && isMounted) {
            setCurrentUser(verifiedProfile);
            createActiveSession(session.access_token, verifiedProfile);
            setIsInitialized(true);
            return;
          } else {
            // Token expired or invalid: clear session
            await supabase.auth.signOut();
            await destroySession();
            if (isMounted) setCurrentUser(null);
          }
        } else {
          // 3. Fallback check for legacy cached session (offline/fallback compatibility)
          const cachedUser = getCurrentSession();
          if (cachedUser && isMounted) {
            setCurrentUser(cachedUser);
          }
        }
      } catch (err) {
        console.warn('[AERIS AUTH CONTEXT] Session initialization failed:', err);
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    }

    initAuth();

    // 4. Subscribe to Supabase auth state changes
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.access_token) {
          const profile = await fetchCurrentUserProfile(session.access_token);
          if (profile && isMounted) {
            setCurrentUser(profile);
            createActiveSession(session.access_token, profile);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setCurrentUser(null);
          await destroySession();
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
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

  const logout = async () => {
    await destroySession();
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
