"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, 
  Activity, 
  RotateCcw, 
  GraduationCap, 
  Wrench, 
  Settings, 
  MessageSquare,
  LogOut,
  LogIn,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Crown,
  Compass,
  FileText,
  Signal,
  Cpu
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Sidebar({ mobileOpen = false, setMobileOpen = () => {} }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // Persisted collapse state on desktop
  const [collapsed, setCollapsed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoaded(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("sidebar_collapsed", JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  const currentRole = user?.role || "public";

  // Navigation Items according to application routes & roles (matching exact previous naming)
  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutGrid,
      show: true,
    },
    {
      label: "Historique",
      href: "/history",
      icon: FileText,
      show: true,
    },
    {
      label: "Analyse Climatique",
      href: "/analysis",
      icon: GraduationCap,
      show: user && (user.role === "admin" || user.role === "tech" || user.role === "researcher"),
    },
    {
      label: "Santé & Alertes",
      href: "/diagnostics",
      icon: Signal,
      show: user && (user.role === "admin" || user.role === "tech"),
    },
    {
      label: "Maintenance",
      href: "/maintenance",
      icon: Cpu,
      show: user && (user.role === "admin" || user.role === "tech"),
    },
    {
      label: "Supervision",
      href: "/supervision",
      icon: Compass,
      show: user && user.role === "admin",
    },
    {
      label: "Interprétation",
      href: "/interpretation",
      icon: MessageSquare,
      show: true,
    },
  ];

  // Helper for role label & badge icon
  const getRoleBadge = () => {
    if (!user) return { label: "Visiteur Public", icon: User };
    switch (user.role) {
      case "admin":
        return { label: "Super Administrateur", icon: Crown };
      case "tech":
        return { label: "Technicien Réseau", icon: Wrench };
      case "researcher":
        return { label: "Chercheur Climat", icon: GraduationCap };
      default:
        return { label: "Utilisateur", icon: User };
    }
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  // Get user initial for yellow circle avatar
  const getUserInitial = () => {
    if (!user) return "P";
    if (user.name) return user.name.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return "S";
  };

  const visibleItems = menuItems.filter((item) => item.show);

  // Render Inner Sidebar Content
  const renderContent = (isMobile = false) => {
    const isCondensed = !isMobile && collapsed;

    return (
      <div className="flex flex-col h-full justify-between select-none">
        {/* Top Header / Brand Logo */}
        <div>
          <div className={`flex items-center justify-between pb-6 pt-1 ${isCondensed ? "px-1 flex-col gap-3" : "px-2"}`}>
            <Link href="/" className="flex items-center gap-3 group overflow-hidden">
              {/* Logo Emblem */}
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg group-hover:scale-105 transition-all shrink-0">
                <Activity className="w-5 h-5 text-white" />
              </div>
              
              {!isCondensed && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-white text-base tracking-wider uppercase leading-none font-sans">
                    Station Météo
                  </span>
                  <span className="text-[10px] text-indigo-300/80 font-semibold tracking-widest uppercase mt-1">
                    Système Connecté
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle Button */}
            {!isMobile && (
              <button
                onClick={toggleCollapse}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all border border-slate-700/50 active:scale-95 cursor-pointer"
                title={collapsed ? "Déplier le menu" : "Replier le menu"}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}

            {/* Mobile Close Button */}
            {isMobile && (
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Section Title */}
          {!isCondensed && (
            <div className="px-3 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Menu
              </span>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  title={isCondensed ? item.label : undefined}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-full transition-all duration-200 font-medium ${
                    isCondensed ? "justify-center px-0 py-3" : ""
                  } ${
                    isActive
                      ? "bg-white text-[#0f2042] font-bold shadow-lg shadow-black/20 scale-[1.02]"
                      : "text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-1"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#0f2042]" : "text-indigo-400"}`} />
                  {!isCondensed && (
                    <span className="text-sm tracking-wide truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: User Profile & Actions */}
        <div className="pt-4 border-t border-slate-750 space-y-2.5">
          {/* User Card */}
          <div
            className={`bg-slate-800/60 border border-slate-700/50 rounded-2xl p-2.5 flex items-center ${
              isCondensed ? "justify-center p-2" : "gap-3"
            } shadow-inner`}
            title={isCondensed && user ? `${user.name || user.email}` : undefined}
          >
            {/* Yellow Circle Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#FFD600] text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
              {getUserInitial()}
            </div>

            {!isCondensed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-white truncate">
                  {user?.name || user?.email?.split("@")[0] || "Super Administrateur"}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {user?.email || "admin@stationmeteo.cd"}
                </span>
              </div>
            )}
          </div>

          {/* Role Pill Badge */}
          {!isCondensed && (
            <div className="bg-indigo-500/15 border border-indigo-500/30 rounded-2xl py-2 px-3 text-center flex items-center justify-center gap-2 text-xs font-extrabold text-indigo-300 shadow-sm">
              <RoleIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{roleInfo.label}</span>
            </div>
          )}

          {/* Logout / Login Button */}
          {user ? (
            <button
              onClick={logout}
              title={isCondensed ? "Déconnexion" : undefined}
              className={`w-full bg-rose-500/10 hover:bg-rose-600/30 text-rose-300 hover:text-white border border-rose-500/20 hover:border-rose-400/40 rounded-2xl ${
                isCondensed ? "py-3 px-0 justify-center" : "py-2.5 px-4 justify-center gap-2"
              } flex items-center font-bold text-xs tracking-wide transition-all shadow-md active:scale-95 cursor-pointer`}
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
              {!isCondensed && <span>Déconnexion</span>}
            </button>
          ) : (
            <Link
              href="/login"
              title={isCondensed ? "Connexion" : undefined}
              className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl ${
                isCondensed ? "py-3 px-0 justify-center" : "py-2.5 px-4 justify-center gap-2"
              } flex items-center font-bold text-xs tracking-wide transition-all shadow-md active:scale-95`}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!isCondensed && <span>Se Connecter</span>}
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col h-full bg-[#0f2042] text-white rounded-[28px] p-4 shadow-2xl border border-slate-750 transition-all duration-300 shrink-0 ${
          collapsed ? "w-[84px]" : "w-[270px]"
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* 2. MOBILE DRAWER OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm md:hidden flex"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-[280px] max-w-[85vw] h-full bg-[#0f2042] text-white p-5 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col border-r border-slate-750"
            onClick={(e) => e.stopPropagation()}
          >
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
