import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  SquarePen,
  Library as LibraryIcon,
  Folder,
  Plus,
  Clock,
  Cpu,
  Cloud,
  MoreHorizontal,
  Search,
  PanelLeft,
  Store,
  X,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  Shield,
  Trash2,
  MessageSquare,
  Sprout
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export default function Sidebar({
  isOpen,
  onToggle,
  isMobileOpen,
  onCloseMobile
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    isAuthenticated,
    openAuthModal,
    logout,
    getInitials
  } = useAuth();
  const {
    chats,
    activeChatId,
    selectChat,
    createNewChat,
    deleteChat
  } = useChat();

  const handleNewChatClick = () => {
    createNewChat();
    if (location.pathname !== '/' && location.pathname !== '/chat') {
      navigate('/chat');
    }
    if (onCloseMobile) onCloseMobile();
  };

  const handleChatHistoryClick = (chat) => {
    selectChat(chat.id);
    if (location.pathname !== '/' && location.pathname !== '/chat') {
      navigate('/chat');
    }
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-[#ececec] font-sans select-none border-r border-[#1e1e1e]">
      {/* 1. TOP HEADER: AERIS brand + Search & Toggle icons */}
      <div className="p-3.5 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center p-1 shadow-sm">
            <img src="/logo.svg" alt="AERIS" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-lg text-white font-display tracking-tight">
            AERIS
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              navigate('/chat');
              if (onCloseMobile) onCloseMobile();
            }}
            className="p-1.5 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors cursor-pointer"
            title="Search Chats"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onToggle}
            className="hidden md:flex p-1.5 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors cursor-pointer"
            title="Toggle sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-[#b4b4b4] hover:text-white hover:bg-[#212121] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. PRIMARY MENU ITEMS */}
      <div className="px-2 py-1 space-y-0.5 text-sm font-normal">
        {/* New Chat */}
        <button
          onClick={handleNewChatClick}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#ececec] hover:bg-[#212121] transition-colors text-left cursor-pointer"
        >
          <SquarePen className="w-4 h-4 text-[#ececec] shrink-0" />
          <span className="font-medium text-sm">New chat</span>
        </button>

        {/* Library */}
        <NavLink
          to="/library"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-sm ${
              isActive ? 'bg-[#212121] text-white font-medium' : 'text-[#ececec] hover:bg-[#212121]'
            }`
          }
        >
          <LibraryIcon className="w-4 h-4 text-[#ececec] shrink-0" />
          <span>Library</span>
        </NavLink>

        {/* Projects */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl text-[#ececec] hover:bg-[#212121] transition-colors cursor-pointer group">
          <div className="flex items-center gap-3 text-sm">
            <Folder className="w-4 h-4 text-[#ececec] shrink-0" />
            <span>Projects</span>
          </div>
          <Plus className="w-3.5 h-3.5 text-[#8e8e8e] group-hover:text-white" />
        </div>

        {/* Extreme Alerts */}
        <NavLink
          to="/alerts"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-sm ${
              isActive ? 'bg-[#212121] text-white font-medium' : 'text-[#ececec] hover:bg-[#212121]'
            }`
          }
        >
          <Clock className="w-4 h-4 text-[#ececec] shrink-0" />
          <span>Extreme Alerts</span>
        </NavLink>

        {/* Weather Map */}
        <NavLink
          to="/map"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-sm ${
              isActive ? 'bg-[#212121] text-white font-medium' : 'text-[#ececec] hover:bg-[#212121]'
            }`
          }
        >
          <Cpu className="w-4 h-4 text-[#ececec] shrink-0" />
          <span>Weather Map</span>
        </NavLink>

        {/* Crop Intelligence */}
        <NavLink
          to="/crops"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left text-sm ${
              isActive ? 'bg-[#212121] text-emerald-300 font-medium' : 'text-[#ececec] hover:bg-[#212121]'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Crop Intelligence</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ML
          </span>
        </NavLink>

        {/* Climate Intelligence */}
        <NavLink
          to="/climate"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-sm ${
              isActive ? 'bg-[#212121] text-white font-medium' : 'text-[#ececec] hover:bg-[#212121]'
            }`
          }
        >
          <Cloud className="w-4 h-4 text-[#ececec] shrink-0" />
          <span>Climate Intelligence</span>
        </NavLink>

        {/* More */}
        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left text-sm ${
              isActive ? 'bg-[#212121] text-white font-medium' : 'text-[#ececec] hover:bg-[#212121]'
            }`
          }
        >
          <MoreHorizontal className="w-4 h-4 text-[#ececec] shrink-0" />
          <span>Settings</span>
        </NavLink>
      </div>

      {/* 3. RECENTS SECTION */}
      <div className="flex-1 overflow-y-auto px-2 pt-4 pb-2 space-y-1">
        <div className="px-3 pb-1 text-xs font-semibold text-[#8e8e8e] flex items-center justify-between">
          <span>Recents</span>
          {chats.length > 0 && (
            <span className="text-[10px] font-mono text-[#71717a]">{chats.length}</span>
          )}
        </div>

        <div className="space-y-0.5">
          {chats.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <MessageSquare className="w-5 h-5 mx-auto text-[#52525b] mb-1.5 opacity-60" />
              <p className="text-xs text-[#a1a1aa] font-medium">No previous chats</p>
              <p className="text-[11px] text-[#71717a]">Your queries will appear here</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isSelected = activeChatId === chat.id;
              return (
                <div
                  key={chat.id}
                  onClick={() => handleChatHistoryClick(chat)}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#212121] text-white font-medium shadow-sm'
                      : 'text-[#d1d1d1] hover:bg-[#212121]/60 hover:text-white'
                  }`}
                >
                  <span className="truncate pr-2 text-xs">{chat.title}</span>
                  <button
                    type="button"
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#71717a] hover:text-red-400 hover:bg-red-950/40 transition-all shrink-0 cursor-pointer"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. BOTTOM AUTH / USER PROFILE */}
      <div className="p-2 border-t border-[#1e1e1e]">
        {isAuthenticated && currentUser ? (
          /* ================= LOGGED IN USER CARD ================= */
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#212121] transition-colors">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentUser.avatarColor || 'from-emerald-500 to-teal-600'} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ring-1 ring-white/10`}>
                {getInitials(currentUser.name)}
              </div>
              <div className="text-left overflow-hidden">
                <span className="text-sm font-medium text-[#ececec] block leading-tight truncate">
                  {currentUser.name}
                </span>
                <span className="text-[11px] text-emerald-400 font-mono block leading-tight">
                  {currentUser.role || 'Citizen'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ================= GUEST / LOGGED OUT ACTION ================= */
          <div className="p-2.5 rounded-xl bg-[#141820] border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Sign in to save telemetry</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => openAuthModal('signin')}
                className="py-1.5 px-2 rounded-lg bg-[#212631] hover:bg-[#2c3342] text-xs font-medium text-slate-200 text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white text-center shadow-sm transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                <span>Sign Up</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block h-screen transition-all duration-300 z-30 shrink-0 ${
          isOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {isOpen && sidebarContent}
      </aside>

      {/* Toggle button when Desktop Sidebar is collapsed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="hidden md:flex fixed top-3 left-3 z-40 p-2 rounded-xl bg-[#0d0d0d] text-[#b4b4b4] hover:text-white border border-[#262626] shadow-md cursor-pointer"
          title="Open sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}

      {/* Mobile Slide-Out Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 h-full z-10 shadow-2xl animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
