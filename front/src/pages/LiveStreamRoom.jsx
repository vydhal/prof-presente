import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../contexts/SocketContext";
import api from "../lib/api";
import { Send, Users, AlertCircle, Loader2, CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import YouTube from "react-youtube";

const LiveStreamRoom = () => {
    const { id: eventId } = useParams(); // Event ID
    const navigate = useNavigate();
    const { user } = useAuth();
    const socket = useSocket();

    const [liveStream, setLiveStream] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [onlineCount, setOnlineCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [checkinWindow, setCheckinWindow] = useState(null);
    const [hasConfirmedCheckin, setHasConfirmedCheckin] = useState(false);
    const [confirmingCheckin, setConfirmingCheckin] = useState(false);

    const chatEndRef = useRef(null);

    useEffect(() => {
        fetchLiveStream();
        return () => {
            // Quando sair da página, sai da sala do Socket
            if (liveStream?.id && socket) {
                socket.emit("leave_live", { liveStreamId: liveStream.id });
            }
        };
    }, [eventId]);

    const fetchLiveStream = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/live-streams/events/${eventId}`);
            setLiveStream(res.data);

            if (res.data.id) {
                fetchChatHistory(res.data.id);
                fetchCheckinStatus(res.data.id);
            }
        } catch (err) {
            setError(
                err.response?.data?.error || "Você não tem acesso a esta transmissão."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchChatHistory = async (liveStreamId) => {
        try {
            const res = await api.get(`/live-streams/${liveStreamId}/chat`);
            setMessages(res.data);
        } catch (err) {
            console.error("Erro ao carregar chat", err);
        }
    };

    const fetchCheckinStatus = async (liveStreamId) => {
        try {
            const res = await api.get(`/live-streams/${liveStreamId}/checkin/status`);
            setCheckinWindow(res.data.open ? res.data.window : null);
            setHasConfirmedCheckin(!!res.data.alreadyConfirmed);
        } catch (err) {
            console.error("Erro ao carregar status do check-in ao vivo", err);
        }
    };

    const handleConfirmCheckin = async () => {
        if (!liveStream?.id || confirmingCheckin) return;
        setConfirmingCheckin(true);
        try {
            await api.post(`/live-streams/${liveStream.id}/checkin/confirm`);
            setHasConfirmedCheckin(true);
            toast.success("Presença confirmada com sucesso!");
        } catch (err) {
            const message = err.response?.data?.error || "Não foi possível confirmar sua presença.";
            // Já ter check-in prévio (ex.: autocheckin por tempo assistido) não é um erro real para o usuário
            if (err.response?.status === 409) {
                setHasConfirmedCheckin(true);
                toast.info("Sua presença já estava registrada neste evento.");
            } else {
                toast.error(message);
            }
        } finally {
            setConfirmingCheckin(false);
        }
    };

    useEffect(() => {
        if (!socket || !liveStream?.id) return;

        // Entrar na sala Realtime específica para essa live
        socket.emit("join_live", { liveStreamId: liveStream.id, user });

        const handleNewMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
            setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        };

        const handleOnlineCount = (count) => {
            setOnlineCount(count);
        };

        const handleCheckinOpened = (data) => {
            setCheckinWindow(data);
            toast.info("Check-in liberado! Confirme sua presença.");
        };

        const handleCheckinClosed = () => {
            setCheckinWindow(null);
        };

        socket.on("new_live_message", handleNewMessage);
        socket.on("live_online_count", handleOnlineCount);
        socket.on("checkin_window_opened", handleCheckinOpened);
        socket.on("checkin_window_closed", handleCheckinClosed);

        return () => {
            socket.off("new_live_message", handleNewMessage);
            socket.off("live_online_count", handleOnlineCount);
            socket.off("checkin_window_opened", handleCheckinOpened);
            socket.off("checkin_window_closed", handleCheckinClosed);
        };
    }, [socket, liveStream?.id, user]);

    // Heartbeat de Watch Time
    useEffect(() => {
        if (!liveStream?.id) return;

        const pingAttendance = async () => {
            try {
                await api.post(`/live-streams/${liveStream.id}/ping`);
            } catch (err) {
                console.error("Falha ao registrar visualização", err);
            }
        };

        pingAttendance(); // Primeiro ping imediato
        const interval = setInterval(pingAttendance, 60000); // e dps a cada 60s

        return () => clearInterval(interval);
    }, [liveStream?.id]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !liveStream?.id) return;

        socket.emit("send_live_message", {
            liveStreamId: liveStream.id,
            userId: user.id,
            message: newMessage.trim(),
        });

        setNewMessage("");
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-accent" />
            </div>
        );
    }

    if (error || !liveStream) {
        return (
            <div className="flex h-[calc(100vh-100px)] flex-col items-center justify-center space-y-4 p-8">
                <AlertCircle className="h-16 w-16 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-800">Acesso Negado</h2>
                <p className="text-gray-600 text-center">{error}</p>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="mt-4 px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 focus:ring-4 focus:ring-accent/20 transition-all font-medium"
                >
                    Voltar para o Início
                </button>
            </div>
        );
    }

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
            controls: 1, // Mantemos os controles nativos do YT mas bloqueamos embeds externos via painel do Youtube (Unlisted)
        },
    };

    return (
        <div className="h-[calc(100vh-160px)] lg:h-[calc(100vh-80px)] flex flex-col md:flex-row overflow-hidden bg-gray-50 border-t border-gray-200">

            {/* Esquerda: Player de Vídeo */}
            <div className="relative bg-black flex flex-col shrink-0 h-[38vh] sm:h-[45vh] md:h-auto md:flex-1 md:shrink">
                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 flex items-center gap-1.5 md:gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-white text-xs md:text-sm font-medium border border-white/10 shadow-lg">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 animate-pulse"></div>
                    AO VIVO
                </div>
                <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 flex items-center gap-1.5 md:gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-white text-xs md:text-sm font-medium border border-white/10 shadow-lg">
                    <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-300" />
                    {onlineCount}<span className="hidden sm:inline"> assistindo agora</span>
                </div>

                {checkinWindow && !hasConfirmedCheckin && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-sm">
                        <button
                            onClick={handleConfirmCheckin}
                            disabled={confirmingCheckin}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-70 text-white font-semibold px-6 py-3 rounded-full shadow-lg shadow-green-900/30 transition-all animate-in fade-in slide-in-from-bottom-4"
                        >
                            {confirmingCheckin ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-5 h-5" />
                            )}
                            Confirmar Presença
                        </button>
                    </div>
                )}

                {hasConfirmedCheckin && checkinWindow && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-green-600/90 backdrop-blur-md text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        Presença confirmada
                    </div>
                )}

                {liveStream.provider === "YOUTUBE" && liveStream.streamId ? (
                    <div className="w-full h-full">
                        <YouTube
                            videoId={liveStream.streamId}
                            opts={opts}
                            className="w-full h-full"
                            containerClassName="w-full h-full relative iframe-container"
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-50" />
                        <p className="text-lg">A transmissão começará em breve...</p>
                    </div>
                )}
            </div>

            {/* Direita: Chat em Tempo Real */}
            <div className="w-full flex-1 min-h-0 md:h-full md:flex-none md:w-[380px] lg:w-[420px] bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col shrink-0 shadow-[-5px_0_20px_-15px_rgba(0,0,0,0.1)]">
                {/* Header do Chat */}
                <div className="h-12 md:h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-6 bg-gradient-to-r from-accent/5 to-transparent shrink-0">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                        Chat Interativo
                    </h3>
                </div>

                {/* Mensagens */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-2 py-10">
                            <MessageCircle className="w-10 h-10 opacity-40" />
                            <p className="text-sm">Nenhuma mensagem ainda.</p>
                            <p className="text-xs">Seja o primeiro a comentar na transmissão!</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => {
                        const isMe = msg.user.id === user.id;
                        return (
                            <div
                                key={msg.id || idx}
                                className={`flex gap-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMe ? 'flex-row-reverse' : ''}`}
                            >
                                {!isMe && (
                                    <img
                                        src={msg.user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user.name)}&background=random`}
                                        alt={msg.user.name}
                                        className="w-8 h-8 rounded-full shadow-sm ring-2 ring-white"
                                    />
                                )}
                                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && <span className="text-xs font-semibold text-gray-500 mb-1 ml-1">{msg.user.name}</span>}
                                    <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-accent text-white rounded-tr-none shadow-md shadow-accent/10' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
                                        <p className="break-words leading-relaxed">{msg.message}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                {/* Input de Chat */}
                <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="w-full pl-5 pr-14 py-3.5 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="absolute right-2 p-2 bg-accent text-white rounded-full hover:bg-accent/90 disabled:opacity-50 disabled:hover:bg-accent transition-all hover:scale-105 active:scale-95 shadow-md"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LiveStreamRoom;
