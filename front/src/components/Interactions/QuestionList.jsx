import { useState, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { MessageCircle, ThumbsUp, Check, Star } from "lucide-react";
import { toast } from "sonner";

const QuestionList = ({ eventId, isSpeakerOrAdmin }) => {
    const socket = useSocket();
    const { user } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState("");

    useEffect(() => {
        if (!socket || !eventId) return;

        // Entrar na sala
        socket.emit("join_event_room", { eventId, user });

        // Listeners
        socket.on("question_received", (question) => {
            setQuestions((prev) => [question, ...prev]);
        });

        socket.on("question_updated", (updatedQuestion) => {
            setQuestions((prev) =>
                prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
            );
        });

        return () => {
            socket.off("question_received");
            socket.off("question_updated");
        };
    }, [socket, eventId, user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;
        if (!user) {
            toast.error("Faça login para enviar perguntas.");
            return;
        }

        socket.emit("new_question", {
            eventId,
            userId: user.id,
            text: newQuestion,
        });
        setNewQuestion("");
        toast.success("Pergunta enviada!");
    };

    const handleVote = (questionId) => {
        if (!user) return;
        socket.emit("vote_question", { questionId, eventId });
    };

    const handleMarkAnswered = (questionId) => {
        if (!isSpeakerOrAdmin) return;
        socket.emit("mark_answered", { questionId, eventId });
    };

    // Ordenar: Respondidas pro fim, depois por votos
    const sortedQuestions = [...questions].sort((a, b) => {
        if (a.isAnswered === b.isAnswered) {
            return b.votes - a.votes; // Mais votadas primeiro
        }
        return a.isAnswered ? 1 : -1; // Respondidas por último
    });

    if (!socket) return <div className="text-sm text-slate-500">Conectando ao chat...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-[#137fec]" />
                        Perguntas & Respostas
                    </h3>

                    {isSpeakerOrAdmin && (
                        <Button
                            onClick={() => {
                                const prize = prompt("O que será sorteado?");
                                if (prize) {
                                    socket.emit("start_giveaway", { eventId, prize });
                                    toast.info("Iniciando sorteio...");
                                }
                            }}
                            variant="outline"
                            className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-900/20"
                        >
                            <Star className="w-4 h-4 mr-2" />
                            Sorteio Relâmpago
                        </Button>
                    )}
                </div>

                {/* Form para Nova Pergunta */}
                {user ? (
                    <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
                        <input
                            type="text"
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="Digite sua pergunta para o palestrante..."
                            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm focus:ring-2 focus:ring-[#137fec] outline-none transition-all"
                        />
                        <Button type="submit" className="bg-[#137fec] hover:bg-blue-600 text-white">
                            Enviar
                        </Button>
                    </form>
                ) : (
                    <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-center text-sm text-slate-500">
                        Faça login para participar.
                    </div>
                )}

                {/* Lista de Perguntas */}
                <div className="space-y-4">
                    {sortedQuestions.length === 0 ? (
                        <p className="text-center text-slate-400 italic py-8">
                            Nenhuma pergunta ainda. Seja o primeiro!
                        </p>
                    ) : (
                        sortedQuestions.map((q) => (
                            <div
                                key={q.id}
                                className={`p-4 rounded-lg border ${q.isAnswered
                                    ? "bg-slate-50 border-slate-100 opacity-60 dark:bg-slate-900 dark:border-slate-800"
                                    : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 shadow-sm"
                                    } transition-all`}
                            >
                                <div className="flex gap-4">
                                    {/* Votos */}
                                    <div className="flex flex-col items-center gap-1 min-w-[40px]">
                                        <button
                                            onClick={() => handleVote(q.id)}
                                            disabled={q.isAnswered}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-[#137fec]"
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                        </button>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {q.votes}
                                        </span>
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="flex-1">
                                        <p className="text-slate-800 dark:text-slate-200 font-medium mb-1">
                                            {q.text}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500">
                                                {q.user?.name || "Anônimo"} • {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>

                                            {/* Ações de Moderação */}
                                            {isSpeakerOrAdmin && !q.isAnswered && (
                                                <button
                                                    onClick={() => handleMarkAnswered(q.id)}
                                                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full transition-colors"
                                                >
                                                    <Check className="w-3 h-3" />
                                                    Marcar como Respondida
                                                </button>
                                            )}
                                            {q.isAnswered && (
                                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> Respondida
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionList;
