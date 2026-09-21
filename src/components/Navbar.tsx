import React, { useState } from 'react';
import { User, NotificationItem } from '../types';
import {
  Briefcase,
  Bell,
  CheckCircle2,
  Server,
  Layers,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Sparkles,
  Radio,
  Clock,
  X
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllRead: () => void;
  onOpenArchitecture: () => void;
  onOpenKafkaLog: () => void;
  onOpenSecurityAudit: () => void;
  activeTab: 'MANAGER' | 'EMPLOYEE' | 'KAFKA' | 'ARCHITECTURE';
  setActiveTab: (tab: 'MANAGER' | 'EMPLOYEE' | 'KAFKA' | 'ARCHITECTURE') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  notifications,
  onMarkNotificationRead,
  onMarkAllRead,
  onOpenArchitecture,
  onOpenKafkaLog,
  onOpenSecurityAudit,
  activeTab,
  setActiveTab,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-2xl border-b border-white/10 text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Branding & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/80 via-cyan-500/80 to-blue-600/80 p-[1px] shadow-lg flex items-center justify-center backdrop-blur-md">
              <div className="w-full h-full bg-slate-950/80 backdrop-blur-xl rounded-[11px] flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
                  Employee Task Assignment System
                </h1>
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                  Microservices
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Architect: <span className="text-slate-200 font-semibold">YARAMALA SHUBHAROOP AKUL</span>
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-manager-btn"
              onClick={() => setActiveTab('MANAGER')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'MANAGER'
                  ? 'bg-gradient-to-r from-indigo-600/80 to-cyan-600/80 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-white/20 backdrop-blur-md'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Manager Portal</span>
            </button>

            <button
              id="nav-employee-btn"
              onClick={() => setActiveTab('EMPLOYEE')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'EMPLOYEE'
                  ? 'bg-gradient-to-r from-indigo-600/80 to-cyan-600/80 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-white/20 backdrop-blur-md'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Employee Workboard</span>
            </button>

            <button
              id="nav-kafka-btn"
              onClick={onOpenKafkaLog}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center space-x-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Kafka Event Stream</span>
            </button>

            <button
              id="nav-architecture-btn"
              onClick={onOpenArchitecture}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center space-x-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>SOA Architecture</span>
            </button>
          </nav>

          {/* Right Tools: Security, Notifications, User Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Semgrep Security Button */}
            <button
              id="security-audit-btn"
              onClick={onOpenSecurityAudit}
              title="Semgrep Static Code Security Audit"
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors relative"
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900"></span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                id="notification-bell-btn"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-modal rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/20">
                  <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-slate-950/40 backdrop-blur-md">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">Kafka Push Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllRead}
                        className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications found for this user.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => onMarkNotificationRead(n.id)}
                          className={`p-3 text-xs transition-colors cursor-pointer ${
                            !n.read ? 'bg-indigo-500/20 text-white font-medium backdrop-blur-sm' : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-semibold text-slate-100">{n.title}</span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] mt-1"></span>}
                          </div>
                          <p className="text-slate-300 text-[11px] mt-1 line-clamp-2">{n.message}</p>
                          <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-1.5 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Role Switcher Dropdown */}
            <div className="relative">
              <button
                id="user-role-switcher-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 p-1.5 pr-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-white transition-all backdrop-blur-md shadow-sm"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                />
                <div className="text-left hidden lg:block">
                  <p className="font-semibold text-[11px] leading-tight text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-cyan-300 font-bold tracking-wide">{currentUser.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 glass-modal rounded-2xl shadow-2xl z-50 p-2.5 border border-white/20">
                  <div className="px-2.5 py-1.5 mb-1.5 border-b border-white/10 text-[10px] font-bold text-cyan-300 uppercase tracking-widest font-mono">
                    Switch User / JWT Role
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSelectUser(u);
                          setShowUserDropdown(false);
                          if (u.role === 'MANAGER') setActiveTab('MANAGER');
                          else setActiveTab('EMPLOYEE');
                        }}
                        className={`w-full flex items-center space-x-2.5 p-2 rounded-xl text-left text-xs transition-all ${
                          u.id === currentUser.id
                            ? 'bg-indigo-500/30 text-white border border-indigo-400/40 backdrop-blur-md shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                            : 'hover:bg-white/10 text-slate-200'
                        }`}
                      >
                        <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20" />
                        <div className="flex-1 truncate">
                          <p className="font-semibold text-slate-100 truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-300">{u.title}</p>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${
                            u.role === 'MANAGER'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
