import React from "react";
import { useParams, Link } from "react-router-dom";
import InteractionsTab from "../components/InteractionsTab";
import { Button } from "../components/ui/button";
import { ArrowLeft, Monitor, EyeOff, Info, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { eventsAPI, enrollmentsAPI } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import GiveawayDisplay from "../components/Interactions/GiveawayDisplay";
import { useSocket } from "../contexts/SocketContext";
import { useTheme } from "../contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

const InteractionsRoom = () => {
    const { id: eventId } = useParams();
    const { user } = useAuth();
    const socket = useSocket();
    const { theme, toggleTheme } = useTheme();
    const [isConnected, setIsConnected] = React.useState(false);

    // Fetch event details
    const { data: event } = useQuery({
        queryKey: ["event", eventId],
        queryFn: async () => {
            const response = await eventsAPI.getById(eventId);
            return response.data;
        },
        enabled: !!eventId
    });

    // Fetch user enrollment status
    const { data: enrollment } = useQuery({
        queryKey: ["enrollment", eventId, user?.id],
        queryFn: async () => {
            const response = await enrollmentsAPI.getByEventStatus(eventId);
            return response.data;
        },
        enabled: !!eventId && !!user?.id
    });

    const isEnrollmentApproved = enrollment?.enrolled && enrollment?.status === "APPROVED";

    const isModerator = user?.role === "ADMIN" || user?.role === "SPEAKER" || user?.role === "ORGANIZER";

    React.useEffect(() => {
        if (!socket || !eventId) return;

        const onConnect = () => {
            console.log(`[DEBUG] Painel conectado (${socket.id}). Tentando entrar na sala: ${eventId}`);
            socket.emit("join_event_room", { eventId, user });
            setIsConnected(true);
        };

        const onDisconnect = () => {
            console.log("[DEBUG] Painel desconectado!");
            setIsConnected(false);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        if (socket.connected) {
            onConnect();
        }

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, [socket, eventId, user]);

    const openProjector = () => {
        window.open(`/events/${eventId}/presentation`, "_blank");
    };

    const clearProjector = () => {
        socket.emit("highlight_question", { questionId: null, eventId });
        socket.emit("highlight_media", { media: null, eventId });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f14] font-sans text-slate-900 dark:text-slate-100 flex flex-col h-screen overflow-hidden transition-colors duration-300">
            {/* Projector Overlay/Status */}
            <GiveawayDisplay eventId={eventId} />

            {/* Sidebar (Control Pane) - Hidden on mobile if not active, or just a bar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden md:flex w-20 lg:w-64 bg-white dark:bg-[#0f1720] border-r border-slate-200 dark:border-slate-800 flex-col items-center py-6 gap-6 transition-colors">
                    <div className="lg:px-6 w-full mb-4">
                        <Link to="/" className="flex items-center gap-3 justify-center lg:justify-start">
                            <div className="bg-blue-600 p-2 rounded-lg text-white">
                                <Monitor className="w-5 h-5" />
                            </div>
                            <span className="hidden lg:block font-bold text-white tracking-tight text-xl">PRO <span className="text-blue-500">PRESENTE</span></span>
                        </Link>
                    </div>

                    <nav className="flex-1 w-full px-3 space-y-2">
                        <div className="px-3 mb-2 hidden lg:block">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Painel de Sala</span>
                        </div>
                        <Link to="/events" className="block">
                            <Button variant="ghost" className="w-full justify-center lg:justify-start gap-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5">
                                <Calendar className="w-5 h-5" />
                                <span className="hidden lg:block">Eventos</span>
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            className="w-full justify-center lg:justify-start gap-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                            onClick={toggleTheme}
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            <span className="hidden lg:block">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                        </Button>
                    </nav>

                    <div className="px-3 w-full mt-auto">
                        <Link to="/dashboard" className="w-full font-medium">
                            <Button variant="outline" className="w-full justify-center lg:justify-start gap-3 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden lg:block">Sair da Sala</span>
                            </Button>
                        </Link>
                    </div>
                </aside>

                {/* Main Dashboard Area */}
                <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#0a0f14]">
                    {/* Header / Top Bar */}
                    <header className="h-20 bg-white/80 dark:bg-[#0f1720]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard" className="md:hidden">
                                <Button variant="ghost" size="icon" className="text-slate-500">
                                    <ArrowLeft className="w-6 h-6" />
                                </Button>
                            </Link>
                            <div className="flex flex-col">
                                <h1 className="font-bold text-lg md:text-xl text-slate-900 dark:text-white truncate max-w-[180px] md:max-w-md">
                                    {event?.title || "Interação em Tempo Real"}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Sala Ativa • {user?.name}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isModerator && (
                                <>
                                    <Button
                                        variant="outline"
                                        className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                        onClick={openProjector}
                                    >
                                        <Monitor className="w-4 h-4" />
                                        Abrir Telão
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex items-center gap-2 shadow-lg shadow-red-900/20"
                                        onClick={clearProjector}
                                    >
                                        <EyeOff className="w-4 h-4" />
                                        <span className="hidden sm:inline">Limpar Telão</span>
                                    </Button>
                                </>
                            )}
                        </div>
                    </header>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        <div className="max-w-5xl mx-auto py-8 px-4 md:px-8">
                            {/* The actual interaction components */}
                            <InteractionsTab eventId={eventId} isEnrollmentApproved={isEnrollmentApproved} />
                        </div>
                    </div>
                </main>
            </div>

            {/* DIAGNOSTIC OVERLAY (Temporary) */}
            <div className="fixed bottom-4 right-4 bg-white/80 dark:bg-black/80 backdrop-blur border border-slate-200 dark:border-white/10 p-2 rounded text-[10px] font-mono text-slate-500 dark:text-white/40 flex flex-col gap-1 z-[100] shadow-xl">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Painel: {isConnected ? 'Conectado' : 'Desconectado'}</span>
                </div>
            </div>
        </div>
    );
};

export default InteractionsRoom;
