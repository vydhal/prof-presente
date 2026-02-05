import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
    Hop as Home,
    Calendar,
    FileText,
    CreditCard,
    Shield,
    QrCode,
    Trophy,
    Star
} from "lucide-react";

const BottomNavbar = () => {
    const { user, isAdmin, isOrg } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        {
            name: "Dash",
            href: "/dashboard",
            icon: Home,
        },
        {
            name: "Eventos",
            href: "/events",
            icon: Calendar,
        },
        {
            name: "Inscrições",
            href: "/my-enrollments",
            icon: FileText,
        },
        // Show Admin link if allowed
        ...(isAdmin || user?.role === "GESTOR_ESCOLA" || isOrg
            ? [{ name: "Admin", href: "/admin", icon: Shield }]
            : []),
        // Fallback: If not admin, show Profile or Check-in?
        // Let's stick to 4 or 5 items max for mobile.
        // If we have too many, maybe a "More" or just prioritize.
        // Currently we have: Dashboard, Events, Enrollments.
        // Let's add Profile as the last one if not Admin? Or always?
        {
            name: "Perfil",
            href: "/profile",
            icon: CreditCard
        }
    ];

    // Checkin is important for organizers/admins too but maybe too crowded?
    // Let's keep it simple.

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#101922] border-t border-gray-200 dark:border-slate-800 z-50 lg:hidden flex justify-around items-center p-2 pb-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.href}
                        to={item.href}
                        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${active
                                ? "text-[#137fec] dark:text-[#137fec]"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                    >
                        <Icon className="h-6 w-6" />
                        <span className="text-[10px] mt-1 font-medium">{item.name}</span>
                    </Link>
                );
            })}
        </div>
    );
};

export default BottomNavbar;
