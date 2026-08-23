import Link from "next/link";
import "./globals.css";
import AuthProviderWrapper from "../components/AuthProviderWrapper";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "Station Météo - Connectée",
  description: "Système de surveillance climatique professionnel en temps réel avec analyse FreeRTOS.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="bg-slate-950 text-slate-100 min-h-full flex flex-col font-sans bg-dot-grid relative">
        <AuthProviderWrapper>
          {/* Background Blur Blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none animate-float"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none animate-float" style={{ animationDelay: "2s" }}></div>

          {/* Floating Navbar client component */}
          <Navbar />

          {/* Page Content wrapper with top padding for fixed header */}
          <main className="flex-1 pt-28 flex flex-col">{children}</main>

          {/* Footer */}
          <footer className="py-8 border-t border-slate-900 bg-slate-950/50 backdrop-blur-sm mt-auto text-center text-xs text-slate-500">
            <p>© 2026 Station Météo. Tous droits réservés.</p>
          </footer>
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
