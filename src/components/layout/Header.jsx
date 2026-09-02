import React from 'react';
import { Menu, LogIn, UserPlus, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onOpenMobileMenu }) {
  const navigate = useNavigate();
  const {
    currentUser,
    isAuthenticated,
    openAuthModal,
    logout,
    getInitials
  } = useAuth();

  return (
    <header className="h-14 border-b border-[#1e293b]/60 bg-[#07131b]/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between select-none z-20 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 md:hidden border border-slate-700/60 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center p-1 shadow-sm group-hover:border-emerald-400/60 transition-colors">
            <img src="/logo.svg" alt="AERIS" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider text-white font-display">
                AERIS
              </span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-widest font-semibold uppercase">
                SATELLITE ENVIRONMENTAL INTELLIGENCE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right User & Live Status & Auth Buttons */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live Telemetry Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIVE TELEMETRY SYNC</span>
        </div>

        {isAuthenticated && currentUser ? (
          /* ================= LOGGED IN USER BAR ================= */
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${currentUser.avatarColor || 'from-emerald-500 to-teal-600'} text-white flex items-center justify-center text-xs font-bold shadow-sm ring-1 ring-white/20`}>
              {getInitials(currentUser.name)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-200 leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-emerald-400/90 font-mono leading-none">
                {currentUser.role || 'Citizen'}
              </span>
            </div>
            <button
              onClick={logout}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors border border-red-500/20 flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          /* ================= LOGGED OUT AUTH BUTTONS ================= */
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAuthModal('signin')}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 border border-slate-700/60 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => openAuthModal('signup')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-950/50 hover:shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
