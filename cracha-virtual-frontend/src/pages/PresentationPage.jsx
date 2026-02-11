import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../components/ui/card";
import { pdfjs, Document, Page } from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2
} from "lucide-react";
import { useBranding } from "../contexts/BrandingContext";

// Configuração do worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PresentationPage = () => {
    const { platformName } = useBranding();
    const { id: eventId } = useParams();
    const socket = useSocket();
    const { user } = useAuth();
    const [highlightedQuestion, setHighlightedQuestion] = useState(null);
    const [highlightedMedia, setHighlightedMedia] = useState(null);
    const [giveawayState, setGiveawayState] = useState("IDLE"); // IDLE, RUNNING, WINNER, PREPARED
    const [giveawayData, setGiveawayData] = useState(null);
    const [displayValue, setDisplayValue] = useState(""); // For animation
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState("");
    const [numPages, setNumPages] = useState(null);
    const numPagesRef = React.useRef(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pdfScale, setPdfScale] = useState(1.0);

    const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:3000";

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        numPagesRef.current = numPages;
        setPageNumber(1);
    };

    const changePage = (offset) => {
        setPageNumber(prevPageNumber => {
            const newPage = prevPageNumber + offset;
            const total = numPagesRef.current || 1;
            return Math.min(Math.max(1, newPage), total);
        });
    };

    useEffect(() => {
        socket.onAny((eventName, ...args) => {
            console.log(`[SOCKET-ANY] Recebido evento: ${eventName}`, args);
        });

        const onConnect = () => {
            console.log(`[DEBUG] Socket conectado (${socket.id}). Tentando entrar na sala: ${eventId}`);
            socket.emit("join_event_room", { eventId, user });
            setIsConnected(true);
        };

        const onDisconnect = () => {
            console.log("[DEBUG] Socket desconectado!");
            setIsConnected(false);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        // Se já estiver conectado no primeiro render, dispara o join
        if (socket.connected) {
            onConnect();
        }

        socket.on("question_highlighted", (question) => {
            console.log("[DEBUG] Recebido question_highlighted:", question);
            setLastEvent("question_highlighted");
            setHighlightedQuestion(question);
            setHighlightedMedia(null);
            setGiveawayState("IDLE");
        });

        socket.on("media_highlighted", (media) => {
            console.log("[DEBUG] Recebido media_highlighted:", media);
            setLastEvent("media_highlighted");
            setHighlightedMedia(media);
            setHighlightedQuestion(null);
            setGiveawayState("IDLE");
        });

        socket.on("giveaway_prepared", ({ config, prize }) => {
            console.log("[DEBUG] Recebido giveaway_prepared:", { config, prize });
            setGiveawayState("PREPARED");
            setGiveawayData({ config, prize });
            setHighlightedQuestion(null);
            setHighlightedMedia(null);
        });

        socket.on("giveaway_started", ({ prize }) => {
            console.log("[DEBUG] Recebido giveaway_started:", { prize });
            setGiveawayState("RUNNING");
            setGiveawayData((prev) => ({ ...prev, prize }));
            setHighlightedQuestion(null);
            setHighlightedMedia(null);
        });

        socket.on("giveaway_winner", (data) => {
            console.log("[DEBUG] Recebido giveaway_winner:", data);
            setGiveawayState("WINNER");
            setGiveawayData(data);
        });

        socket.on("slide_action_triggered", ({ action }) => {
            console.log(`[PASSADOR] Comando recebido: ${action}`);

            // Se tiver PDF ativo, muda a página localmente
            if (action === "next") {
                changePage(1);
            } else if (action === "prev" || action === "previous") {
                changePage(-1);
            }

            // Fallback para iframes
            const isNext = action === "next";
            const keyCode = isNext ? 39 : 37;
            const key = isNext ? "ArrowRight" : "ArrowLeft";

            const eventConfig = {
                key: key,
                code: isNext ? "ArrowRight" : "ArrowLeft",
                keyCode: keyCode,
                which: keyCode,
                bubbles: true,
                cancelable: true,
                composed: true,
                view: window
            };

            const triggerEvents = () => {
                try {
                    // Garantir que a janela principal tem foco
                    window.focus();

                    // Disparar em múltiplos níveis
                    const event = new KeyboardEvent("keydown", eventConfig);
                    document.dispatchEvent(event);
                    window.dispatchEvent(event);

                    if (isNext) {
                        const spaceEvent = new KeyboardEvent("keydown", {
                            key: " ", code: "Space", keyCode: 32, which: 32, bubbles: true
                        });
                        document.dispatchEvent(spaceEvent);
                    }
                } catch (err) {
                    console.error("[PASSADOR] Erro ao disparar KeyboardEvent:", err);
                }

                // Tentar controlar iframes
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach((iframe, idx) => {
                    try {
                        // Tentar dar foco ao iframe
                        iframe.focus();

                        // Lista de payloads comuns para diferentes players
                        const payloads = [
                            { method: isNext ? "next" : "previous", type: "slide" },
                            { command: isNext ? "nextSlide" : "prevSlide" },
                            { slide: isNext ? "next" : "prev" },
                            { type: "google-slides", action: isNext ? "next" : "previous" }
                        ];

                        payloads.forEach(p => {
                            iframe.contentWindow.postMessage(JSON.stringify(p), "*");
                            iframe.contentWindow.postMessage(p, "*");
                        });
                    } catch (e) {
                        // Erros de cross-origin são ignorados em postMessage
                    }
                });
            };

            // Disparar imediatamente e com um pequeno delay para garantir captura
            triggerEvents();
            setTimeout(triggerEvents, 100);
        });

        // Garantir foco inicial ao clicar em qualquer lugar da página (ajuda o passador)
        const handleDocClick = () => {
            const iframe = document.querySelector('iframe');
            if (iframe) iframe.focus();
        };
        document.addEventListener('click', handleDocClick);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("question_highlighted");
            socket.off("media_highlighted");
            socket.off("giveaway_prepared");
            socket.off("giveaway_started");
            socket.off("giveaway_winner");
            socket.off("slide_action_triggered");
            document.removeEventListener('click', handleDocClick);
        };
    }, [socket, eventId, user]);

    // Giveaway Animation
    useEffect(() => {
        let interval;
        if (giveawayState === "RUNNING" && giveawayData?.config) {
            interval = setInterval(() => {
                const { type, min, max, items } = giveawayData.config;
                if (type === 'numbers') {
                    const rnd = Math.floor(Math.random() * (max - min + 1)) + min;
                    setDisplayValue(rnd);
                } else if (type === 'names' && items && items.length > 0) {
                    const rndItem = items[Math.floor(Math.random() * items.length)];
                    setDisplayValue(rndItem);
                }
            }, 80);
        }
        return () => clearInterval(interval);
    }, [giveawayState, giveawayData]);

    // Transform content URL to Embed URL
    const getEmbedUrl = (media) => {
        if (!media || !media.url) return null;
        let url = media.url.trim();

        // YouTube detection: more robust regex for various formats including shorts
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
        const ytMatch = url.match(ytRegex);

        if (ytMatch && ytMatch[1]) {
            return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
        }

        // Google Slides detection
        if (url.includes('docs.google.com/presentation')) {
            // Extract the core presentation ID and rebuild embed link
            const slidesIdMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
            if (slidesIdMatch && slidesIdMatch[1]) {
                return `https://docs.google.com/presentation/d/${slidesIdMatch[1]}/embed?start=false&loop=false&delayms=3000`;
            }
        }

        // Ensure protocol for generic links
        if (!url.startsWith('http')) {
            return `https://${url}`;
        }

        return url;
    };

    return (
        <div className="h-screen w-full bg-black text-white overflow-hidden relative">
            <AnimatePresence>
                {/* STATE: MEDIA HIGHLIGHTED */}
                {highlightedMedia && (
                    <motion.div
                        key={`media-${highlightedMedia.url}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-black z-30 overflow-hidden"
                    >
                        {highlightedMedia.type === 'pdf' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 group">
                                <Document
                                    file={highlightedMedia.url.startsWith('http') ? highlightedMedia.url : `${API_BASE_URL}${highlightedMedia.url}`}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    loading={<div className="text-white animate-pulse font-black text-2xl uppercase tracking-widest">Carregando Slides...</div>}
                                    error={<div className="text-red-500 font-bold">Erro ao carregar PDF</div>}
                                >
                                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={pageNumber}
                                                initial={{ x: 300, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                exit={{ x: -300, opacity: 0 }}
                                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                                className="shadow-2xl flex items-center justify-center"
                                            >
                                                <Page
                                                    pageNumber={pageNumber}
                                                    scale={pdfScale}
                                                    renderTextLayer={true}
                                                    renderAnnotationLayer={true}
                                                    width={window.innerWidth * 0.95}
                                                    height={window.innerHeight * 0.9}
                                                    className="max-h-full max-w-full"
                                                />
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </Document>

                                {/* Overlay de navegação (aparece no hover) */}
                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button onClick={() => changePage(-1)} className="text-white hover:text-blue-400 transition-colors">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <span className="text-white font-black text-xs tracking-[0.2em] min-w-[100px] text-center uppercase">
                                        Pág {pageNumber} / {numPages}
                                    </span>
                                    <button onClick={() => changePage(1)} className="text-white hover:text-blue-400 transition-colors">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <iframe
                                className="w-full h-full border-none"
                                src={getEmbedUrl(highlightedMedia)}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Projeção de Mídia"
                            />
                        )}
                    </motion.div>
                )}

                {/* STATE: IDLE */}
                {giveawayState === "IDLE" && !highlightedQuestion && !highlightedMedia && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50 space-y-4 z-0"
                    >
                        <h1 className="text-7xl font-black tracking-tighter uppercase text-slate-100">{platformName}</h1>
                        <p className="text-xl font-medium tracking-widest text-blue-500 uppercase">Aguardando Sequência</p>
                    </motion.div>
                )}

                {/* STATE: QUESTION HIGHLIGHTED */}
                {highlightedQuestion && (
                    <motion.div
                        key={`question-${highlightedQuestion.id}`}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center px-8 z-20"
                    >
                        <div className="w-full max-w-7xl relative p-12 overflow-hidden rounded-[2.5rem] bg-[#0f1720]/80 backdrop-blur-3xl border border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>

                            <div className="flex items-center gap-6 mb-10">
                                {highlightedQuestion.user?.photoUrl ? (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-20"></div>
                                        <img
                                            src={highlightedQuestion.user.photoUrl}
                                            alt="Avatar"
                                            className="w-24 h-24 rounded-full border-4 border-slate-800 object-cover relative z-10"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-black relative z-10 shadow-lg">
                                        {highlightedQuestion.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="text-left">
                                    <h2 className="text-3xl font-bold text-white mb-1">
                                        {highlightedQuestion.user?.name}
                                    </h2>
                                    <p className="text-blue-500 font-black uppercase tracking-widest text-sm">Pergunta do Público</p>
                                </div>
                            </div>
                            <p className="text-6xl md:text-7xl font-black leading-[1.1] text-slate-100 drop-shadow-2xl">
                                "{highlightedQuestion.text}"
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* GIVEAWAY STATES (Same as before but with minor UI polish) */}
                {giveawayState === "PREPARED" && (
                    <motion.div key="prepared" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12 bg-slate-900/40 rounded-[3rem] border border-slate-800 backdrop-blur-md">
                        <h2 className="text-8xl font-black mb-12 tracking-tighter text-blue-500">SORTEIO</h2>
                        {giveawayData?.prize && (
                            <div className="mb-12">
                                <span className="text-2xl text-slate-500 block mb-3 uppercase tracking-[0.3em] font-black">Prêmio</span>
                                <h3 className="text-9xl font-black text-white drop-shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                                    {giveawayData.prize}
                                </h3>
                            </div>
                        )}
                        <p className="text-2xl text-slate-600 animate-pulse font-bold tracking-widest">AGUARDANDO O PALESTRANTE...</p>
                    </motion.div>
                )}

                {giveawayState === "RUNNING" && (
                    <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                        <div className="bg-gradient-to-tr from-slate-900 to-black p-24 rounded-full w-[600px] h-[600px] flex items-center justify-center mx-auto border-8 border-slate-800 shadow-[0_0_150px_rgba(59,130,246,0.2)]">
                            <span className="text-[12rem] font-black text-white drop-shadow-2xl font-mono tabular-nums">
                                {displayValue}
                            </span>
                        </div>
                        <div className="mt-12 text-4xl uppercase font-black tracking-[0.5em] text-blue-500 animate-pulse">Sorteando</div>
                    </motion.div>
                )}

                {giveawayState === "WINNER" && (
                    <motion.div key="winner" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5, duration: 1 }} className="text-center">
                        <h2 className="text-6xl text-blue-500 font-black mb-8 uppercase tracking-tighter">TEMOS UM VENCEDOR!</h2>
                        <div className="bg-white text-black p-20 rounded-[3rem] shadow-[0_0_150px_rgba(255,255,255,0.4)] border-[12px] border-blue-600">
                            <h1 className="text-8xl md:text-9xl font-black leading-tight break-words">
                                {giveawayData?.winner?.name}
                            </h1>
                            {giveawayData?.prize && <p className="text-3xl mt-6 uppercase font-black text-slate-500 tracking-widest">Prêmio: {giveawayData.prize}</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DIAGNOSTIC OVERLAY (Temporary) */}
            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur border border-white/10 p-2 rounded text-[10px] font-mono text-white/40 flex flex-col gap-1 z-[100]">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Socket: {isConnected ? 'Conectado' : 'Desconectado'}</span>
                </div>
                <div>ID: {eventId}</div>
                <div>Last: {lastEvent || 'Nenhum'}</div>
            </div>
        </div>
    );
};

export default PresentationPage;
