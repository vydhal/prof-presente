import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import {
    LayoutDashboard as Home,
    Calendar,
    FileText,
    Shield,
    CreditCard,
    MessageSquare,
    Trophy,
    Trophy,
    Settings,
    Globe
} from "lucide-react";

const BottomNavbar = () => {
    const { user, isAdmin, isOrg } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const isActive = (path) => location.pathname === path;

    const navItems = [
        {
            name: "Site",
            href: "/",
            icon: Globe,
        },
        {
            name: "Home",
            href: "/dashboard",
            icon: Home,
        },
        {
            name: "Eventos",
            href: "/events",
            icon: Calendar,
        },
        {
            name: "Salas",
            href: "/interactions",
            icon: MessageSquare,
        },
        {
            name: "Inscrições",
            href: "/my-enrollments",
            icon: FileText,
        },
        {
            name: "Perfil",
            href: "/profile",
            icon: CreditCard
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
            {/* Safe Area Padding for iOS/Modern Android */}
            <div className="px-3 pb-4 pt-2">
                <nav className="relative flex items-center justify-around bg-white/80 dark:bg-[#0f1720]/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-2 px-3 shadow-2xl shadow-blue-500/10">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className="relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all"
                            >
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: active ? 1.1 : 1,
                                        y: active ? -2 : 0
                                    }}
                                    className={`relative z-10 ${active ? "text-blue-500 scale-110" : "text-slate-400 dark:text-slate-500"}`}
                                >
                                    <Icon className="h-6 w-6 stroke-[2.5]" />

                                    {active && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </motion.div>
                                <span className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider transition-colors ${active ? "text-blue-500 opacity-100" : "text-slate-400 opacity-60"}`}>
                                    {item.name}
                                </span>

                                {active && (
                                    <motion.div
                                        layoutId="activeBox"
                                        className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

export default BottomNavbar;

