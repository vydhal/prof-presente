import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard as Home,
    Calendar,
    FileText,
    Shield,
    CreditCard,
    MessageSquare,
    Trophy,
    Settings,
    Globe,
    Star,
    QrCode,
    GraduationCap,
    LayoutGrid,
    X
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";

const BottomNavbar = () => {
    const { user, isAdmin, isOrg } = useAuth();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (!user) return null;

    const isActive = (path) => location.pathname === path;

    // Itens rápidos que aparecem diretamente na barra inferior
    const quickItems = [
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
        }
    ];

    // Menu Completo (todas as opções na grade)
    const fullNavigation = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: Home,
        },
        {
            name: "Ver Site",
            href: "/",
            icon: Globe,
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
            name: "Minhas Trilhas",
            href: "/my-tracks",
            icon: GraduationCap,
        },
        {
            name: "Meu Perfil",
            href: "/profile",
            icon: CreditCard,
        },
        {
            name: "Avaliações",
            href: "/evaluations",
            icon: Star,
        },
        {
            name: "Ranking",
            href: "/ranking",
            icon: Trophy,
        },
        ...(isAdmin || user?.role === "CHECKIN_COORDINATOR" || isOrg
            ? [{ name: "Check-in", href: "/check-in", icon: QrCode }]
            : []),
        ...(isAdmin || user?.role === "GESTOR_ESCOLA" || isOrg
            ? [
                { name: "Administração", href: "/admin", icon: Shield },
                { name: "Gerenciar Trilhas", href: "/admin/tracks", icon: GraduationCap }
              ]
            : []),
        ...(isAdmin || isOrg || user?.role === "CERIMONIAL"
            ? [{ name: "Espaços", href: "/spaces", icon: Calendar }]
            : []),
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden">
            {/* Safe Area Padding for iOS/Modern Android */}
            <div className="px-3 pb-6 pt-2 bg-gradient-to-t from-background via-background/80 to-transparent">
                <nav className="relative flex items-center justify-around bg-card/95 backdrop-blur-xl border border-white/10 rounded-full p-2 px-3 shadow-spotify">
                    {quickItems.map((item) => {
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
                                    className={`relative z-10 ${active ? "text-primary scale-110" : "text-muted-foreground"}`}
                                >
                                    <Icon className="h-6 w-6 stroke-[2.5]" />

                                    {active && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </motion.div>
                                <span className={`text-[10px] mt-1.5 font-bold uppercase tracking-[1.4px] transition-colors ${active ? "text-primary opacity-100" : "text-muted-foreground opacity-60"}`}>
                                    {item.name}
                                </span>

                                {active && (
                                    <motion.div
                                        layoutId="activeBox"
                                        className="absolute inset-0 bg-primary/10 rounded-full"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}

                    {/* Botão Menu (Mais) */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all"
                    >
                        <div className={`relative z-10 ${isMenuOpen ? "text-primary" : "text-muted-foreground"}`}>
                            <LayoutGrid className="h-6 w-6 stroke-[2.5]" />
                        </div>
                        <span className={`text-[10px] mt-1.5 font-bold uppercase tracking-[1.4px] transition-colors ${isMenuOpen ? "text-primary opacity-100" : "text-muted-foreground opacity-60"}`}>
                            Menu
                        </span>
                    </button>
                </nav>
            </div>

            {/* Menu Completo Dialog */}
            <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DialogContent className="w-[92%] max-w-[480px] rounded-3xl bg-card/95 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
                    <DialogHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
                        <DialogTitle className="text-xl font-bold tracking-wide uppercase text-foreground">
                            Menu Completo
                        </DialogTitle>
                    </DialogHeader>

                    {/* Grade de Navegação */}
                    <div className="grid grid-cols-3 gap-3 py-6 max-h-[60vh] overflow-y-auto pr-1">
                        {fullNavigation.map((item, idx) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={idx}
                                    to={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2 group ${
                                        active
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-muted/30 border-white/5 hover:bg-muted/50 text-muted-foreground"
                                    }`}
                                >
                                    <div className={`p-3 rounded-full transition-transform group-hover:scale-110 ${
                                        active ? "bg-primary/20 text-primary" : "bg-card border border-white/5 shadow-sm text-foreground/80"
                                    }`}>
                                        <Icon className="h-5 w-5 stroke-[2.2]" />
                                    </div>
                                    <span className="text-[10px] font-semibold tracking-wide uppercase leading-tight max-w-[85px] truncate">
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BottomNavbar;
