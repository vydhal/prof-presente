import React, { useState, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";
import GiveawayControl from "./Interactions/GiveawayControl";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
    ThumbsUp,
    MessageSquare,
    CheckCircle,
    Monitor,
    Trophy,
    MoreVertical,
    Eye,
    EyeOff,
    Trash2,
    Youtube,
    FileText,
    Link as LinkIcon,
    Plus,
    Clock,
    User,
    Check,
    X,
    Info,
    ChevronLeft,
    ChevronRight,
    Maximize2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";
import api, { eventsAPI } from "../lib/api";

const InteractionsTab = ({ eventId, isEnrollmentApproved }) => {
    const socket = useSocket();
    const { user } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [mediaLink, setMediaLink] = useState("");
    const [mediaType, setMediaType] = useState("youtube"); // youtube | pdf | web
    const [activeMedia, setActiveMedia] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const isModerator = user?.role === "ADMIN" || user?.role === "SPEAKER" || user?.role === "ORGANIZER";

    // Load initial questions and Join Room
    useEffect(() => {
        if (!socket || !eventId) return;

        socket.emit("join_event_room", { eventId, user });

        const fetchQuestions = async () => {
            try {
                const response = await eventsAPI.getQuestions(eventId);
                setQuestions(response.data);
            } catch (error) {
                console.error("Failed to load questions", error);
            }
        };
        fetchQuestions();

        socket.on("question_received", (question) => {
            setQuestions((prev) => [question, ...prev]);
        });

        socket.on("question_updated", (updatedQuestion) => {
            setQuestions((prev) =>
                prev.map((q) => q.id === updatedQuestion.id ? updatedQuestion : q)
            );
        });

        socket.on("question_highlighted", (highlightedQ) => {
            setQuestions((prev) =>
                prev.map((q) => ({
                    ...q,
                    isHighlighted: highlightedQ ? q.id === highlightedQ.id : false
                }))
            );
        });

        socket.on("media_highlighted", (media) => {
            console.log("[SOCKET] Mídia em destaque atualizada:", media);
            setActiveMedia(media);
        });

        return () => {
            socket.off("question_received");
            socket.off("question_updated");
            socket.off("question_highlighted");
            socket.off("media_highlighted");
        };
    }, [socket, eventId, user]);

    const handleSlideAction = (action) => {
        if (!socket || !eventId) return;
        socket.emit("slide_action", { eventId, action });
    };

    const handleSendQuestion = () => {
        if (!newQuestion.trim()) return;
        if (!isEnrollmentApproved && !isModerator) {
            toast.error("Você precisa estar inscrito e aprovado para enviar perguntas.");
            return;
        }
        socket.emit("new_question", { eventId, userId: user.id, text: newQuestion });
        setNewQuestion("");
        toast.success("Pergunta enviada!");
    };

    const handleVote = (questionId) => {
        socket.emit("vote_question", { questionId, eventId });
    };

    const handleHighlight = (questionId) => {
        socket.emit("highlight_question", { questionId, eventId });
    };

    const handleMarkAnswered = (questionId) => {
        socket.emit("mark_answered", { questionId, eventId });
    };

    const handleToggleApproval = (questionId, currentStatus) => {
        socket.emit("toggle_approval", { questionId, eventId, isApproved: !currentStatus });
    };

    const handlePresentationUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !eventId) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("presentation", file);

        try {
            const response = await api.post(`/events/${eventId}/presentation`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const url = response.data.url;
            handleSendMedia(url, 'pdf');
            toast.success("Apresentação carregada!");
        } catch (error) {
            console.error("Erro no upload:", error);
            toast.error("Falha ao subir arquivo.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendMedia = (url = mediaLink, type = mediaType) => {
        if (!url.trim()) return;
        const payload = {
            eventId,
            media: { type, url }
        };
        socket.emit("highlight_media", payload);
        if (type !== 'pdf') setMediaLink("");
        toast.success("Mídia enviada para o telão!");
    };

    const handleClearMedia = async () => {
        if (!socket || !eventId) return;

        // Cleanup: Se for um PDF subido pelo usuário, tentar limpar do servidor
        if (activeMedia?.type === 'pdf' && activeMedia?.url?.includes('/uploads/presentations/')) {
            try {
                await api.delete(`/events/${eventId}/presentation`, {
                    data: { url: activeMedia.url }
                });
            } catch (err) {
                console.warn("[CLEANUP] Erro ao limpar arquivo:", err);
            }
        }

        socket.emit("highlight_media", { eventId, media: null });
        toast.info("Limpando mídia...");
    };

    // Sort and Filter questions
    const displayedQuestions = isModerator
        ? [...questions]
        : questions.filter(q => q.userId === user?.id);

    const sortedQuestions = displayedQuestions.sort((a, b) => {
        if (a.isHighlighted) return -1;
        if (b.isHighlighted) return 1;
        if (a.votes !== b.votes) return b.votes - a.votes;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Tabs defaultValue="questions" className="w-full">
                <TabsList className={`grid w-full ${isModerator ? 'grid-cols-3' : 'grid-cols-1'} bg-slate-100 dark:bg-[#0f1720] border border-slate-200 dark:border-slate-800 p-1 rounded-xl h-12`}>
                    <TabsTrigger value="questions" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white gap-2 transition-all shadow-sm data-[state=active]:shadow-md">
                        <MessageSquare className="w-4 h-4" /> Perguntas
                        <Badge variant="secondary" className="ml-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none px-1.5 h-5 min-w-[20px]">{displayedQuestions.length}</Badge>
                    </TabsTrigger>
                    {isModerator && (
                        <TabsTrigger value="giveaway" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white gap-2 transition-all">
                            <Trophy className="w-4 h-4" /> Sorteios
                        </TabsTrigger>
                    )}
                    {isModerator && (
                        <TabsTrigger value="media" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white gap-2 transition-all">
                            <Plus className="w-4 h-4" /> Mídias
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="questions" className="space-y-6 pt-6">
                    {/* ASK QUESTION BOX */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-10 group-focus-within:opacity-25 transition duration-500"></div>
                        <div className="relative bg-white dark:bg-[#0f1720] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <Textarea
                                placeholder="Enviar mensagem para o Visualizador..."
                                className="resize-none border-none bg-transparent focus-visible:ring-0 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-5 min-h-[100px]"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendQuestion();
                                    }
                                }}
                            />
                            <div className="p-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
                                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider ml-2">Dica: Enter para enviar rápidas</span>
                                <Button
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 font-bold shadow-lg shadow-purple-900/20"
                                    onClick={handleSendQuestion}
                                >
                                    Enviar
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* QUESTIONS LIST */}
                    <div className="space-y-4">
                        {sortedQuestions.length === 0 ? (
                            <div className="text-center py-16 bg-[#0f1720] rounded-xl border border-dashed border-slate-800 text-slate-500 font-medium">
                                Nenhuma pergunta no momento.
                            </div>
                        ) : (
                            sortedQuestions.map((q) => (
                                <div
                                    key={q.id}
                                    className={`relative group transition-all duration-300 ${q.isHighlighted
                                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20'
                                        : 'bg-white dark:bg-[#0f1720] border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700'
                                        } p-5 rounded-2xl border flex flex-col gap-4 shadow-sm hover:shadow-md`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                {q.isHighlighted && (
                                                    <Badge className="bg-emerald-500 text-white dark:text-[#0a0f14] font-black animate-pulse flex gap-1.5 items-center px-2">
                                                        <Check className="w-3 h-3" /> NO TELÃO
                                                    </Badge>
                                                )}
                                                {!q.isApproved && isModerator && (
                                                    <Badge variant="outline" className="border-orange-500/50 text-orange-500 font-bold">
                                                        PENDENTE
                                                    </Badge>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{q.user?.name || "Anônimo"}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                    <span className="text-[11px] text-slate-400 dark:text-slate-600 font-medium">{new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            <p className="text-lg md:text-xl font-medium text-slate-800 dark:text-slate-100 leading-snug">
                                                {q.text}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isModerator ? (
                                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-black/20 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                                                    {!q.isApproved ? (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 text-[11px] font-black uppercase text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400 gap-1.5"
                                                                onClick={() => handleToggleApproval(q.id, false)}
                                                            >
                                                                Aprovar
                                                            </Button>
                                                            <div className="w-px h-4 bg-slate-800" />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 text-[11px] font-black uppercase text-red-500 hover:bg-red-500/10 hover:text-red-400 gap-1.5"
                                                                // Simple hide for now
                                                                onClick={() => handleToggleApproval(q.id, true)}
                                                            >
                                                                Rejeitar
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={`h-8 text-[11px] font-black uppercase gap-1.5 ${q.isHighlighted ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-white'}`}
                                                                onClick={() => handleHighlight(q.isHighlighted ? null : q.id)}
                                                            >
                                                                <Monitor className="w-3.5 h-3.5" />
                                                                {q.isHighlighted ? "Remover" : "Projetar"}
                                                            </Button>
                                                            <div className="w-px h-4 bg-slate-800 mx-1" />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                                                                onClick={() => handleVote(q.id)}
                                                            >
                                                                <ThumbsUp className={`w-4 h-4 ${q.votes > 0 ? 'text-blue-600 fill-blue-600' : ''}`} />
                                                                <span className="ml-1.5 text-xs font-bold">{q.votes || 0}</span>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-2 px-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                                    <ThumbsUp className={`w-5 h-5 ${q.votes > 0 ? 'text-blue-600 dark:text-blue-500 fill-blue-500' : 'text-slate-300 dark:text-slate-700'}`} />
                                                    <span className="text-xs font-bold mt-1 text-slate-500 dark:text-slate-400">{q.votes || 0}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>

                {isModerator && (
                    <>
                        <TabsContent value="giveaway" className="pt-6">
                            <GiveawayControl eventId={eventId} />
                        </TabsContent>

                        <TabsContent value="media" className="space-y-6 pt-6 animate-in slide-in-from-bottom-2">
                            <Card className="bg-white dark:bg-[#0f1720] border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Monitor className="w-4 h-4 text-blue-500" /> Controle de Exibição
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button
                                            variant={mediaType === "youtube" ? "default" : "outline"}
                                            className={`flex-col gap-2 h-24 dark:h-20 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 ${mediaType === "youtube" ? "bg-red-600 border-red-500 text-white hover:bg-red-700" : "text-slate-500 dark:text-slate-400"}`}
                                            onClick={() => setMediaType("youtube")}
                                        >
                                            <Youtube className="w-6 h-6" />
                                            <span className="text-[10px] font-black uppercase">YouTube</span>
                                        </Button>
                                        <Button
                                            variant={mediaType === "pdf" ? "default" : "outline"}
                                            className={`flex-col gap-2 h-24 dark:h-20 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 ${mediaType === "pdf" ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-700" : "text-slate-500 dark:text-slate-400"}`}
                                            onClick={() => setMediaType("pdf")}
                                        >
                                            <FileText className="w-6 h-6" />
                                            <span className="text-[10px] font-black uppercase">PDF/PPT</span>
                                        </Button>
                                        <Button
                                            variant={mediaType === "web" ? "default" : "outline"}
                                            className={`flex-col gap-2 h-24 dark:h-20 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 ${mediaType === "web" ? "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700" : "text-slate-500 dark:text-slate-400"}`}
                                            onClick={() => setMediaType("web")}
                                        >
                                            <LinkIcon className="w-6 h-6" />
                                            <span className="text-[10px] font-black uppercase">Web Link</span>
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">URL do Conteúdo</label>
                                            <div className="flex gap-2">
                                                {mediaType === 'pdf' ? (
                                                    <div className="flex-1">
                                                        <input
                                                            type="file"
                                                            id="presentation-upload"
                                                            className="hidden"
                                                            accept=".pdf,.ppt,.pptx"
                                                            onChange={handlePresentationUpload}
                                                            disabled={isUploading}
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            className="w-full h-12 border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/40 text-slate-600 dark:text-slate-400 font-bold gap-2 hover:border-blue-500 hover:text-blue-500 transition-all"
                                                            onClick={() => document.getElementById('presentation-upload').click()}
                                                            disabled={isUploading}
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                            {isUploading ? "Subindo..." : "Selecionar PDF/PPT da Apresentação"}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Input
                                                        placeholder={
                                                            mediaType === "youtube" ? "https://youtube.com/watch?v=..." :
                                                                "https://exemplo.com"
                                                        }
                                                        className="bg-slate-50 dark:bg-black/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 h-12 rounded-xl focus:ring-blue-500 transition-all"
                                                        value={mediaLink}
                                                        onChange={(e) => setMediaLink(e.target.value)}
                                                    />
                                                )}
                                                {mediaType !== 'pdf' && (
                                                    <Button
                                                        className="bg-blue-600 hover:bg-blue-700 h-12 px-8 font-bold shadow-lg shadow-blue-900/20"
                                                        onClick={() => handleSendMedia()}
                                                    >
                                                        Projetar
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    className="border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 h-12 px-4"
                                                    onClick={handleClearMedia}
                                                >
                                                    <EyeOff className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {activeMedia && (
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="bg-slate-900 dark:bg-black rounded-2xl p-6 shadow-xl border border-blue-500/30">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Controle de Slides</span>
                                                        <h4 className="text-sm font-bold text-white truncate max-w-[200px]">
                                                            {activeMedia.url?.split('/').pop() || "Apresentação Ativa"}
                                                        </h4>
                                                    </div>
                                                    <Badge variant="outline" className="bg-blue-500 text-white border-none animate-pulse">
                                                        AO VIVO
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <Button
                                                        variant="outline"
                                                        className="h-20 bg-slate-800 hover:bg-slate-700 border-slate-700 text-white flex flex-col gap-2 rounded-2xl transition-all active:scale-95"
                                                        onClick={() => handleSlideAction('prev')}
                                                    >
                                                        <ChevronLeft className="w-8 h-8" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Anterior</span>
                                                    </Button>
                                                    <Button
                                                        className="h-20 bg-blue-600 hover:bg-blue-500 text-white flex flex-col gap-2 rounded-2xl shadow-lg shadow-blue-900/40 transition-all active:scale-95"
                                                        onClick={() => handleSlideAction('next')}
                                                    >
                                                        <ChevronRight className="w-8 h-8" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest font-mono">PRÓXIMO</span>
                                                    </Button>
                                                </div>

                                                <div className="mt-4 flex items-center justify-center gap-2 text-slate-500 text-[10px] font-medium uppercase tracking-widest">
                                                    <Maximize2 className="w-3 h-3" />
                                                    Dica: Use no modo paisagem no celular
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-blue-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-blue-100 dark:border-slate-800 flex items-start gap-4 transition-colors">
                                        <div className="bg-blue-500/10 p-2 rounded-lg">
                                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Como funciona?</h4>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-500 leading-relaxed">
                                                Ao projetar uma mídia, o telão principal será substituído pelo conteúdo do link. Certifique-se de que o link é público ou incorporável (como YouTube e Google Slides).
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
};

export default InteractionsTab;
