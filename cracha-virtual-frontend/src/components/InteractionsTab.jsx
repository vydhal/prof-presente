import React, { useState, useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import {
    ThumbsUp,
    MessageSquare,
    CheckCircle,
    Monitor,
    Trophy,
    MoreVertical,
    AlertCircle,
    Eye,
    EyeOff
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";
import { eventsAPI } from "../lib/api"; // Updated import

const InteractionsTab = ({ eventId, isEnrollmentApproved }) => {
    const socket = useSocket();
    const { user } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [giveawayPrize, setGiveawayPrize] = useState("");
    const [isGiveawayModalOpen, setIsGiveawayModalOpen] = useState(false);

    const isModerator = user?.role === "ADMIN" || user?.role === "SPEAKER" || user?.role === "ORGANIZER";

    // Load initial questions and Join Room
    useEffect(() => {
        if (!socket || !eventId) return;

        // 1. Join Room
        socket.emit("join_event_room", { eventId, user });

        // 2. Fetch Questions
        const fetchQuestions = async () => {
            try {
                // Now using the API endpoint we created
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

        // Listen for highlights to update UI state if needed (e.g. show icon)
        socket.on("question_highlighted", (highlightedQ) => {
            setQuestions((prev) =>
                prev.map((q) => ({
                    ...q,
                    isHighlighted: highlightedQ ? q.id === highlightedQ.id : false
                }))
            );
        });

        return () => {
            socket.off("question_received");
            socket.off("question_updated");
            socket.off("question_highlighted");
        };
    }, [socket]);

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

    const handleStartGiveaway = () => {
        if (!giveawayPrize.trim()) {
            toast.error("Digite o nome do prêmio.");
            return;
        }
        socket.emit("start_giveaway", { eventId, prize: giveawayPrize });
        toast.info("Sorteio iniciado no telão!");
        setGiveawayPrize("");
        setIsGiveawayModalOpen(false);
    };

    const openProjector = () => {
        window.open(`/events/${eventId}/presentation`, "_blank");
    };

    // Sort questions: Highlighted first, then by votes, then by date
    const sortedQuestions = [...questions].sort((a, b) => {
        if (a.isHighlighted) return -1;
        if (b.isHighlighted) return 1;
        if (a.votes !== b.votes) return b.votes - a.votes;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
        <div className="space-y-6">
            {/* MODERATOR ACTIONS */}
            {isModerator && (
                <Card className="bg-slate-50 border-dashed border-2">
                    <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="px-2 py-1">Painel do Moderador</Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={openProjector}>
                                <Monitor className="w-4 h-4 mr-2" />
                                Abrir Telão
                            </Button>

                            <Button variant="destructive" size="sm" onClick={() => handleHighlight(null)}>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Limpar Telão
                            </Button>

                            <div className="flex gap-2 items-center bg-white p-1 rounded-md border">
                                <input
                                    className="px-2 py-1 text-sm outline-none w-40"
                                    placeholder="Prêmio do sorteio..."
                                    value={giveawayPrize}
                                    onChange={(e) => setGiveawayPrize(e.target.value)}
                                />
                                <Button size="sm" onClick={handleStartGiveaway} disabled={!giveawayPrize}>
                                    <Trophy className="w-4 h-4 mr-2" />
                                    Sortear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ASK QUESTION */}
            <div className="flex gap-4">
                <Textarea
                    placeholder="Digite sua pergunta para o palestrante..."
                    className="resize-none"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                />
                <Button className="h-auto px-6" onClick={handleSendQuestion}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enviar
                </Button>
            </div>

            {/* QUESTIONS LIST */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    Perguntas Recentes
                    <Badge variant="secondary" className="rounded-full">{questions.length}</Badge>
                </h3>

                {sortedQuestions.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        Nenhuma pergunta enviada ainda. Seja o primeiro!
                    </div>
                ) : (
                    sortedQuestions.map((q) => (
                        <Card key={q.id} className={`transition-all ${q.isHighlighted ? 'border-primary ring-2 ring-primary/20 bg-blue-50/50' : ''}`}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-sm text-gray-700">{q.user?.name}</span>
                                            {q.isHighlighted && <Badge className="bg-blue-500 hover:bg-blue-600">No Telão</Badge>}
                                            {q.isAnswered && <Badge variant="secondary" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Respondida</Badge>}
                                            {!q.isApproved && isModerator && <Badge variant="outline" className="text-orange-500 border-orange-200">Aguardando Aprovação</Badge>}
                                        </div>
                                        <p className="text-gray-800">{q.text}</p>
                                    </div>

                                    <div className="flex flex-col items-center gap-1 min-w-[50px]">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex flex-col h-auto py-2 px-1 hover:bg-blue-50"
                                            onClick={() => handleVote(q.id)}
                                        >
                                            <ThumbsUp className={`w-5 h-5 ${q.votes > 0 ? 'text-blue-500 fill-blue-500' : 'text-gray-400'}`} />
                                            <span className="text-xs font-bold mt-1">{q.votes || 0}</span>
                                        </Button>
                                    </div>

                                    {isModerator && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleHighlight(q.id)}>
                                                    <Monitor className="w-4 h-4 mr-2" />
                                                    {q.isHighlighted ? "Tirar do Telão" : "Destacar no Telão"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleMarkAnswered(q.id)}>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Marcar como Respondida
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleApproval(q.id, q.isApproved)}>
                                                    {q.isApproved ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                                    {q.isApproved ? "Ocultar" : "Aprovar"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default InteractionsTab;
