import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Home, Search, GraduationCap, Calendar, LayoutGrid, Users } from "lucide-react";

const PublicBottomNav = ({ onSearchClick }) => {
    const { user } = useAuth();
    const location = useLocation();
    
    const isActive = (path) => location.pathname === path;
    
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#101922]/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 px-2 py-3 flex items-center justify-around shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
            <Link to="/" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? 'text-[#137fec]' : 'text-slate-500 hover:text-[#137fec] dark:hover:text-[#137fec]'}`}>
                <Home className="w-5 h-5" />
                <span className={`text-[10px] ${isActive('/') ? 'font-bold' : 'font-medium'}`}>Início</span>
            </Link>
            
            {onSearchClick ? (
                <button onClick={onSearchClick} className="flex flex-col items-center gap-1 text-slate-500 hover:text-[#137fec] dark:hover:text-[#137fec] transition-colors">
                    <Search className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Buscar</span>
                </button>
            ) : (
                <Link to="/tracks" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/tracks') ? 'text-[#137fec]' : 'text-slate-500 hover:text-[#137fec] dark:hover:text-[#137fec]'}`}>
                    <Search className="w-5 h-5" />
                    <span className={`text-[10px] ${isActive('/tracks') ? 'font-bold' : 'font-medium'}`}>Buscar</span>
                </Link>
            )}
            
            <Link to="/tracks" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/tracks') ? 'text-[#137fec]' : 'text-slate-500 hover:text-[#137fec] dark:hover:text-[#137fec]'}`}>
                <GraduationCap className="w-5 h-5" />
                <span className={`text-[10px] ${isActive('/tracks') ? 'font-bold' : 'font-medium'}`}>Trilhas</span>
            </Link>
            
            <Link to="/events" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/events') ? 'text-[#137fec]' : 'text-slate-500 hover:text-[#137fec] dark:hover:text-[#137fec]'}`}>
                <Calendar className="w-5 h-5" />
                <span className={`text-[10px] ${isActive('/events') ? 'font-bold' : 'font-medium'}`}>Eventos</span>
            </Link>
            
            <Link to={user ? "/dashboard" : "/login"} className="flex flex-col items-center gap-1 text-slate-500 hover:text-[#137fec] dark:hover:text-[#137fec] transition-colors">
                {user ? <LayoutGrid className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                <span className="text-[10px] font-medium">{user ? "Painel" : "Entrar"}</span>
            </Link>
        </div>
    );
};

export default PublicBottomNav;
