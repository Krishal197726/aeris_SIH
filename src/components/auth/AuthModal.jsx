import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Check,
  HelpCircle,
  Clock,
  RotateCcw,
  Phone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePersona } from '../../context/PersonaContext';
import { validatePasswordRequirements } from '../../services/authService';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    oauthError,
    clearOAuthError,
    login,
    signup,
    getGoogleAuthUrl,
    checkUserExists,
    findMatchingEmails,
    requestPasswordResetOTP,
    resendPasswordResetOTP,
    verifyPasswordResetOTP,
    resetPasswordWithToken
  } = useAuth();
  
  const { personas, setPersona } = usePersona();

  // Wizard Modes: 'initial' | 'password' | 'signup' | 'forgot_email' | 'verify_otp' | 'create_new_password' | 'reset_success'
  const [mode, setMode] = useState('initial');

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('citizen');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email auto-suggestion & existence validation
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [userDoesNotExist, setUserDoesNotExist] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  // OTP 6-Digit input state (strictly empty, no simulation)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);
  const [otpExpiresIn, setOtpExpiresIn] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(60); // 60s cooldown
  const [resetToken, setResetToken] = useState(null);

  // Loading & Alert feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sync mode with context
  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode === 'signin' ? 'initial' : authModalMode);
    }
  }, [authModalMode]);

  // Reset form or set initial oauth error when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      if (oauthError) {
        setErrorMessage(oauthError);
        clearOAuthError();
      } else {
        setErrorMessage('');
      }
      setSuccessMessage('');
      setMode('initial');
      setEmail('');
      setPassword('');
      setName('');
      setConfirmPassword('');
      setEmailSuggestions([]);
      setUserDoesNotExist(false);
      setIsExistingUser(false);
      setOtpDigits(['', '', '', '', '', '']);
      setResetToken(null);
    }
  }, [isAuthModalOpen, oauthError, clearOAuthError]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Countdown timer for OTP expiry & Resend cooldown
  useEffect(() => {
    let timer;
    if (mode === 'verify_otp') {
      timer = setInterval(() => {
        setOtpExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode]);

  if (!isAuthModalOpen) return null;

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Google OAuth Trigger
  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const url = await getGoogleAuthUrl();
      // Redirect browser directly to Google's official OAuth authorization page
      window.location.href = url;
    } catch (err) {
      setErrorMessage(err.message || 'Google sign-in is currently unavailable. Please try again later.');
      setIsLoading(false);
    }
  };

  // Real-time Email input handler with first-letter matching
  const handleEmailChange = async (e) => {
    const val = e.target.value;
    setEmail(val);
    setErrorMessage('');
    setUserDoesNotExist(false);

    const trimmed = val.trim();
    if (trimmed.length === 0) {
      setEmailSuggestions([]);
      return;
    }

    try {
      const matches = await findMatchingEmails(trimmed);
      const filtered = matches.filter(m => m.toLowerCase() !== trimmed.toLowerCase());
      setEmailSuggestions(filtered);
    } catch (err) {
      setEmailSuggestions([]);
    }
  };

  // Select matching suggestion
  const handleSelectSuggestion = (suggestedEmail) => {
    setEmail(suggestedEmail);
    setEmailSuggestions([]);
    setUserDoesNotExist(false);
    setErrorMessage('');
  };

  // Main Initial Continue Action (Email-First)
  const handleInitialContinue = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setUserDoesNotExist(false);

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const exists = await checkUserExists(trimmed);
      if (exists) {
        setIsExistingUser(true);
        setMode('password');
        setPassword('');
      } else {
        setUserDoesNotExist(true);
        setIsExistingUser(false);
      }
    } catch (err) {
      setErrorMessage('Failed to verify email. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Login Submit
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setErrorMessage(err.message || 'Incorrect password.');
    } finally {
      setIsLoading(false);
    }
  };

  // New User Signup Submit
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const roleObj = personas.find(p => p.id === selectedRole);
      const roleLabel = roleObj ? roleObj.label : 'Citizen';

      await signup({
        name,
        email: email.trim(),
        password,
        role: roleLabel
      });

      if (selectedRole) {
        setPersona(selectedRole);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Send Real Email OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const trimmed = email.trim();
      const exists = await checkUserExists(trimmed);
      if (!exists) {
        setUserDoesNotExist(true);
        throw new Error("User doesn't exist.");
      }

      await requestPasswordResetOTP(trimmed);
      setOtpExpiresIn(300);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setMode('verify_otp');
      setSuccessMessage("We've sent a 6-digit verification code to your email.");
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Real Email OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage('');
    setIsLoading(true);

    try {
      await resendPasswordResetOTP(email.trim());
      setOtpExpiresIn(300);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setSuccessMessage('A new verification code has been sent to your email.');
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Digits Input Handler
  const handleOtpChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;

    const newDigits = [...otpDigits];
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      pasted.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = value;
    setOtpDigits(newDigits);
    setErrorMessage('');

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify Real OTP Submit
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyPasswordResetOTP(email.trim(), enteredOtp);
      setResetToken(result.resetToken);
      setPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setSuccessMessage('');
      setMode('create_new_password');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save New Password Submit
  const passwordCheck = validatePasswordRequirements(password);

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!passwordCheck.isValid) {
      setErrorMessage('Please meet all security requirements for your password.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPasswordWithToken({
        email: email.trim(),
        resetToken,
        newPassword: password,
        confirmPassword
      });
      setMode('reset_success');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Click outside to close */}
      <div className="fixed inset-0 -z-10" onClick={closeAuthModal} />

      {/* Centered Modal Card matching Reference Screenshot 1 */}
      <div 
        className="relative w-full max-w-[420px] bg-[#202123] border border-[#303030] rounded-[28px] shadow-2xl p-7 sm:p-8 text-white overflow-hidden transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button top right */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-[#2d2d2d] transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex items-start gap-2.5 text-red-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-start gap-2.5 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 1: MAIN LOGIN / SIGN UP MODAL (REFERENCE SCREENSHOT 1)             */}
        {/* ========================================================================= */}
        {mode === 'initial' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center pt-1 pb-2">
              <h2 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight">
                Log in or sign up
              </h2>
              <p className="text-xs sm:text-sm text-[#c5c5d2] mt-2 font-normal leading-relaxed">
                You’ll get smarter responses and can upload files, images, and more.
              </p>
            </div>

            {/* Social Authentication Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-full border border-[#383838] bg-[#202123] hover:bg-[#2a2b2e] text-white font-medium text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer"
              >
                {/* Official Google Multicolor G Logo */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Continue with Apple */}
              <button
                type="button"
                onClick={() => setErrorMessage('Apple login is configured for enterprise domains.')}
                className="w-full py-3 px-4 rounded-full border border-[#383838] bg-[#202123] hover:bg-[#2a2b2e] text-white font-medium text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer"
              >
                {/* Apple Logo SVG */}
                <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.61-7.85-11.74-14.32-6.52-10.22-11.39-21.78-14.61-34.69-3.22-12.91-4.83-24.63-4.83-35.17 0-14.69 3.65-26.85 10.96-36.48 7.31-9.63 16.71-14.59 28.21-14.88 4.63 0 9.77 1.17 15.42 3.52 5.65 2.34 9.17 3.55 10.57 3.63 2.04 0 5.79-1.29 11.24-3.87 5.45-2.58 10.35-3.81 14.7-3.69 11.83.6 21.36 4.7 28.59 12.31-10.42 6.28-15.54 15.01-15.36 26.2.22 8.78 3.59 16.14 10.12 22.08 6.53 5.94 14.18 9.38 22.95 10.33-2.39 7.39-5.32 14.44-8.8 21.15zM119.22 33.72c0-7.39 2.65-14.28 7.95-20.67 5.3-6.39 11.85-10.24 19.65-11.55.22 1.3.33 2.5.33 3.6 0 7.39-2.79 14.55-8.37 21.48-5.58 6.93-12.22 10.87-19.92 11.82-.11-1.52-.16-2.61-.16-3.28z"/>
                </svg>
                <span>Continue with Apple</span>
              </button>

              {/* Continue with Phone */}
              <button
                type="button"
                onClick={() => setErrorMessage('Phone authentication is available on mobile apps.')}
                className="w-full py-3 px-4 rounded-full border border-[#383838] bg-[#202123] hover:bg-[#2a2b2e] text-white font-medium text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4 text-slate-200 shrink-0" />
                <span>Continue with phone</span>
              </button>
            </div>

            {/* OR Divider */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-[#383838]"></div>
              <span className="px-3 text-xs font-semibold text-[#8e8ea0] tracking-wider">OR</span>
              <div className="flex-1 border-t border-[#383838]"></div>
            </div>

            {/* Email-First Form */}
            <form onSubmit={handleInitialContinue} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-300">Email Address</span>
                  {userDoesNotExist && (
                    <span className="text-[11px] font-semibold text-red-400 flex items-center gap-1 animate-fadeIn">
                      <AlertCircle className="w-3 h-3" />
                      User doesn’t exist.
                    </span>
                  )}
                </div>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Email address"
                  className={`w-full py-3 px-5 bg-[#0d0d0d] border rounded-full text-sm text-white placeholder-[#6b6b7b] focus:outline-none transition-all ${
                    userDoesNotExist
                      ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-[#383838] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                  }`}
                  autoComplete="off"
                />

                {/* First-letter suggestion prompt: "Is this your email?" */}
                {emailSuggestions.length > 0 && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-[#141d26] border border-emerald-500/40 shadow-lg animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 mb-2">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Is this your email?</span>
                    </div>
                    <div className="space-y-1.5">
                      {emailSuggestions.map((matchedEmail) => (
                        <button
                          key={matchedEmail}
                          type="button"
                          onClick={() => handleSelectSuggestion(matchedEmail)}
                          className="w-full px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-left text-xs font-mono text-white flex items-center justify-between group transition-all cursor-pointer"
                        >
                          <span className="truncate text-slate-200 group-hover:text-white">
                            <strong className="text-emerald-400 font-bold">{email}</strong>
                            {matchedEmail.substring(email.length)}
                          </span>
                          <span className="text-[11px] font-sans font-medium text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 shrink-0 ml-2">
                            <Check className="w-3 h-3" />
                            Yes, use this
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Solid White Continue Button matching Screenshot 1 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#ececf1] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>

            {/* Prompt to register if user doesn't exist */}
            {userDoesNotExist && (
              <div className="pt-2 text-center animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setUserDoesNotExist(false);
                    setErrorMessage('');
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline cursor-pointer"
                >
                  Create an account for {email}?
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: EXISTING USER - ENTER PASSWORD                                  */}
        {/* ========================================================================= */}
        {mode === 'password' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode('initial');
                  setErrorMessage('');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>

            <div className="text-center pb-1">
              <h2 className="text-xl font-bold text-white">Enter your password</h2>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121212] border border-[#383838] text-xs font-mono text-slate-300">
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => setMode('initial')}
                  className="text-emerald-400 hover:underline font-sans text-[11px]"
                >
                  Edit
                </button>
              </div>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4 pt-1">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full py-3 pl-10 pr-10 bg-[#0d0d0d] border border-[#383838] rounded-full text-sm text-white placeholder-[#6b6b7b] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_email');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#ececf1] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: SIGN UP / CREATE ACCOUNT                                        */}
        {/* ========================================================================= */}
        {mode === 'signup' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode('initial');
                  setErrorMessage('');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>

            <div className="text-center pb-1">
              <h2 className="text-xl font-bold text-white">Create your account</h2>
              <p className="text-xs text-[#c5c5d2] mt-1">
                Enter your details to register with AERIS Intelligence
              </p>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-3.5 pt-1">
              <div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full py-2.5 px-4 bg-[#0d0d0d] border border-[#383838] rounded-xl text-sm text-white placeholder-[#6b6b7b] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full py-2.5 px-4 bg-[#0d0d0d] border border-[#383838] rounded-xl text-sm text-white placeholder-[#6b6b7b] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full py-2.5 px-4 bg-[#0d0d0d] border border-[#383838] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} Persona — {p.description.split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create Password (min 6 characters)"
                    className="w-full py-2.5 pl-4 pr-10 bg-[#0d0d0d] border border-[#383838] rounded-xl text-sm text-white placeholder-[#6b6b7b] focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full py-2.5 pl-4 pr-10 bg-[#0d0d0d] border border-[#383838] rounded-xl text-sm text-white placeholder-[#6b6b7b] focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#ececf1] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: FORGOT PASSWORD - REQUEST REAL EMAIL OTP                        */}
        {/* ========================================================================= */}
        {mode === 'forgot_email' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode('password');
                  setErrorMessage('');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>

            <div className="text-center pb-1">
              <h2 className="text-xl font-bold text-white">Reset your password</h2>
              <p className="text-xs text-[#c5c5d2] mt-1 leading-relaxed">
                Enter your registered email address to receive a 6-digit verification code.
              </p>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-4 pt-1">
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full py-3 px-5 bg-[#0d0d0d] border border-[#383838] rounded-full text-sm text-white placeholder-[#6b6b7b] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#ececf1] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Send Verification Code</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 5: VERIFY REAL EMAIL OTP (ZERO SIMULATION)                         */}
        {/* ========================================================================= */}
        {mode === 'verify_otp' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode('forgot_email');
                  setErrorMessage('');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Email</span>
              </button>
              <div className="flex items-center gap-1 text-xs font-mono text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                <Clock className="w-3 h-3" />
                <span>{formatTime(otpExpiresIn)}</span>
              </div>
            </div>

            <div className="text-center pb-1">
              <h2 className="text-xl font-bold text-white">Enter Verification Code</h2>
              <p className="text-xs text-[#c5c5d2] mt-1.5 leading-relaxed">
                We’ve sent a 6-digit verification code to <span className="text-emerald-400 font-mono font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-5 pt-1">
              {/* 6 Empty Digit Input Boxes (NO SIMULATED CODES) */}
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-11 h-12 text-center text-xl font-bold font-mono bg-[#0d0d0d] border rounded-xl text-emerald-400 focus:outline-none transition-all ${
                      digit
                        ? 'border-emerald-500 ring-1 ring-emerald-500/40'
                        : 'border-[#383838] focus:border-emerald-500'
                    }`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpExpiresIn === 0}
                className="w-full py-3 px-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#ececf1] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Verify Code & Continue</span>
                )}
              </button>

              <div className="flex items-center justify-center text-xs text-slate-400 pt-1">
                {resendCooldown > 0 ? (
                  <span className="flex items-center gap-1.5 text-slate-500 font-mono">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Resend code in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resend verification code</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 6: CREATE NEW PASSWORD                                             */}
        {/* ========================================================================= */}
        {mode === 'create_new_password' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="text-center pb-1">
              <h2 className="text-xl font-bold text-white">Create New Password</h2>
              <p className="text-xs text-[#c5c5d2] mt-1">
                Choose a strong password to protect your account.
              </p>
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-3.5 pt-1">
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full py-2.5 pl-4 pr-10 bg-[#0d0d0d] border border-[#383838] rounded-xl text-sm text-white placeholder-[#6b6b7b] focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className={`w-full py-2.5 pl-4 pr-10 bg-[#0d0d0d] border rounded-xl text-sm text-white placeholder-[#6b6b7b] focus:outline-none ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-500/80'
                        : 'border-[#383838] focus:border-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <span className="text-[11px] font-semibold text-red-400 block mt-1">
                    Passwords do not match.
                  </span>
                )}
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2b2b2b] space-y-1 text-xs text-slate-300">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Password Requirements
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div className={`flex items-center gap-1 ${passwordCheck.minLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>8+ chars</span>
                  </div>
                  <div className={`flex items-center gap-1 ${passwordCheck.hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>1 uppercase</span>
                  </div>
                  <div className={`flex items-center gap-1 ${passwordCheck.hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>1 lowercase</span>
                  </div>
                  <div className={`flex items-center gap-1 ${passwordCheck.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>1 number</span>
                  </div>
                  <div className={`flex items-center gap-1 col-span-2 ${passwordCheck.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>1 special char (!@#$...)</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !passwordCheck.isValid || password !== confirmPassword}
                className="w-full py-3 px-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#ececf1] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Save New Password</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 7: PASSWORD RESET SUCCESS                                          */}
        {/* ========================================================================= */}
        {mode === 'reset_success' && (
          <div className="text-center space-y-4 py-2 animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Check className="w-7 h-7 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Password reset successfully!</h3>
              <p className="text-xs text-[#c5c5d2] leading-relaxed max-w-xs mx-auto">
                Your account password has been updated securely. You can now log in with your new password.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('password');
                  setPassword('');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="w-full py-3 px-4 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#ececf1] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Back to Login</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
