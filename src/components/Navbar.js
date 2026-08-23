"use client";
import Link from "next/link";
import { Activity, LogOut, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="glass-nav rounded-full px-6 py-3 max-w-5xl w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg group-hover:scale-105 transition-all">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-wider text-white text-lg">
            Station Météo
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="/" className="hover:text-indigo-400 transition-colors">À propos</Link>
          <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">Dashboard</Link>
          <Link href="/history" className="hover:text-indigo-400 transition-colors">Historique</Link>
          <Link href="/interpretation" className="hover:text-indigo-400 transition-colors">Interprétation</Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 text-indigo-300">
                <User className="w-3.5 h-3.5" />
                <span className="font-semibold uppercase">{user.role}</span>
              </div>
              <button 
                onClick={logout} 
                className="p-2 bg-slate-900 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded-full border border-slate-800 hover:border-rose-900/30 transition-all cursor-pointer"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all shadow-md shadow-indigo-900/20"
            >
              Connexion
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
