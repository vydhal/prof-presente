import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useTheme } from "../contexts/ThemeContext";
import { useBranding } from "../contexts/BrandingContext";
import { Button } from "./ui/button";
import {
    Search, Moon, Sun, Menu, X, Share2, Mail, GraduationCap, Laptop, Palette, Users, FlaskConical
} from "lucide-react";
import LogoDefault from "../assets/logo-prof-presente.svg";
import PublicBottomNav from "./PublicBottomNav";

const PublicLayout = ({ children }) => {
    const { user } = useAuth();
    const { platformName, logoUrl } = useBranding();
    const { theme, toggleTheme } = useTheme();
    const isDarkMode = theme === 'dark';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] text-[#0d141b] dark:text-slate-100 transition-colors duration-300 font-sans pb-20 md:pb-0">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#101922]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    {/* LOGO */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            {logoUrl ? (
                                <img src={logoUrl} alt={platformName} className="h-10 w-auto object-contain" />
                            ) : (
                                <div className="bg-[#137fec] p-2 rounded-xl text-white shadow-lg shadow-[#137fec]/20 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                        <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
                                {platformName}
                            </h1>
                            <div className="h-1 w-8 bg-[#137fec] rounded-full"></div>
                        </div>
                    </Link>

                    {/* DESKTOP NAV */}
                    <nav className="hidden lg:flex items-center gap-8 font-bold text-sm text-slate-500 dark:text-slate-400">
                        <Link to="/" className={`hover:text-[#137fec] transition-colors ${location.pathname === '/' ? 'text-[#137fec]' : ''}`}>Início</Link>
                        <Link to="/events" className={`hover:text-[#137fec] transition-colors ${location.pathname === '/events' ? 'text-[#137fec]' : ''}`}>Eventos</Link>
                        <Link to="/tracks" className={`hover:text-[#137fec] transition-colors ${location.pathname === '/tracks' ? 'text-[#137fec]' : ''}`}>Trilhas</Link>
                        <a href="#" className="hover:text-[#137fec] transition-colors">Sobre</a>
                    </nav>

                    {/* ACTIONS */}
                    <div className="hidden lg:flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                        >
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

                        <Link to={user ? "/dashboard" : "/login"}>
                            <Button className="bg-[#137fec] hover:bg-[#137fec]/90 text-white rounded-lg font-bold shadow-lg shadow-[#137fec]/20 transition-all whitespace-nowrap">
                                {user ? "Acessar Painel" : "Entrar / Cadastrar-se"}
                            </Button>
                        </Link>
                    </div>

                    {/* MOBILE TOGGLE */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* MOBILE MENU */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101922] p-4 space-y-4 absolute w-full shadow-xl animate-in slide-in-from-top-5">
                        <nav className="flex flex-col gap-2 font-medium text-slate-600 dark:text-slate-300">
                            <Link to="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Início</Link>
                            <Link to="/events" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Eventos</Link>
                            <Link to="/tracks" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Trilhas</Link>
                            <a href="#" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Sobre</a>
                        </nav>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Link to={user ? "/dashboard" : "/login"} className="w-full block" onClick={() => setMobileMenuOpen(false)}>
                                <Button className="w-full bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold">
                                    {user ? "Acessar Painel" : "Entrar / Cadastrar-se"}
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* CONTENT */}
            <main>{children}</main>

            {/* FOOTER */}
            <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1 space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex items-center gap-2">
                            {logoUrl ? (
                                <img src={logoUrl} alt={platformName} className="h-8 w-auto object-contain" />
                            ) : (
                                <div className="bg-[#137fec] p-1.5 rounded-lg text-white">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                        <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                                    </svg>
                                </div>
                            )}
                            <h1 className="text-lg font-bold tracking-tight">{platformName}</h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Portal oficial de eventos e formação continuada.
                        </p>
                    </div>

                    <div className="hidden md:block">
                        <h4 className="font-bold mb-4">Links Rápidos</h4>
                        <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                            <li><Link to="/events" className="hover:text-[#137fec]">Próximos Eventos</Link></li>
                            <li><a href="#" className="hover:text-[#137fec]">Workshops em Destaque</a></li>
                        </ul>
                    </div>

                    <div className="hidden md:block">
                        <h4 className="font-bold mb-4">Suporte</h4>
                        <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                            <li><a href="#" className="hover:text-[#137fec]">Central de Ajuda</a></li>
                            <li><a href="#" className="hover:text-[#137fec]">Política de Privacidade</a></li>
                        </ul>
                    </div>

                    <div className="hidden md:block">
                        <h4 className="font-bold mb-4">Contato</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Siga-nos nas redes sociais para ficar por dentro das novidades.
                        </p>
                        <div className="flex gap-4">
                            <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-[#137fec] transition-colors"><Share2 className="h-4 w-4" /></button>
                            <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-[#137fec] transition-colors"><Mail className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    © 2026 {platformName}. Desenvolvido para Excelência Educacional.
                </div>
            </footer>
            
            <PublicBottomNav />
        </div>
    );
};

export default PublicLayout;
