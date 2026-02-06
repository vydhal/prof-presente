import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../components/ui/card";

const PresentationPage = () => {
    const { id: eventId } = useParams();
    const socket = useSocket();
    const { user } = useAuth();
    const [highlightedQuestion, setHighlightedQuestion] = useState(null);
    const [giveawayState, setGiveawayState] = useState("IDLE"); // IDLE, RUNNING, WINNER
    const [giveawayData, setGiveawayData] = useState(null);

    useEffect(() => {
        if (!socket || !eventId) return;

        // Join event room (if not already joined by global context)
        socket.emit("join_event_room", { eventId, user });

        socket.on("question_highlighted", (question) => {
            setHighlightedQuestion(question);
            // Se destacar pergunta, esconde sorteio antigo
            if (question) setGiveawayState("IDLE");
        });

        socket.on("giveaway_started", ({ prize }) => {
            setGiveawayState("RUNNING");
            setGiveawayData({ prize });
            setHighlightedQuestion(null); // Esconde pergunta
        });

        socket.on("giveaway_winner", (data) => {
            setGiveawayState("WINNER");
            setGiveawayData(data);
        });

        socket.on("giveaway_error", () => {
            setGiveawayState("IDLE");
        });

        return () => {
            socket.off("question_highlighted");
            socket.off("giveaway_started");
            socket.off("giveaway_winner");
            socket.off("giveaway_error");
        };
    }, [socket, eventId, user]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 overflow-hidden">
            {/* BACKGROUND ANIMATION/IMAGE COULD GO HERE */}

            <AnimatePresence mode="wait">
                {/* STATE: IDLE (Logo or Welcome) */}
                {giveawayState === "IDLE" && !highlightedQuestion && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center opacity-50"
                    >
                        <h1 className="text-6xl font-bold tracking-widest uppercase">Prof Presente</h1>
                        <p className="text-2xl mt-4">Aguardando interações...</p>
                    </motion.div>
                )}

                {/* STATE: HIGHLIGHTED QUESTION (Already Updated) */}
                {highlightedQuestion && (
                    <motion.div
                        key="question"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-full max-w-6xl"
                    >
                        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-12 rounded-3xl text-center shadow-2xl">
                            <div className="flex items-center justify-center gap-6 mb-8">
                                {highlightedQuestion.user?.photoUrl ? (
                                    <img
                                        src={highlightedQuestion.user.photoUrl}
                                        alt="Avatar"
                                        className="w-24 h-24 rounded-full border-4 border-white/30 object-cover"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-4xl font-bold">
                                        {highlightedQuestion.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="text-left">
                                    <h2 className="text-3xl font-light text-blue-300">
                                        {highlightedQuestion.user?.name} perguntou:
                                    </h2>
                                </div>
                            </div>
                            <p className="text-6xl font-bold leading-snug text-white drop-shadow-md">
                                "{highlightedQuestion.text}"
                            </p>
                        </Card>
                    </motion.div>
                )}

                {/* STATE: GIVEAWAY RUNNING */}
                {giveawayState === "RUNNING" && (
                    <motion.div
                        key="running"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <h2 className="text-8xl font-black text-yellow-500 animate-pulse mb-8">
                            SORTEIO
                        </h2>
                        <h3 className="text-4xl">Valendo:</h3>
                        <div className="text-6xl font-bold mt-4 text-white uppercase tracking-wider bg-red-600 inline-block px-8 py-4 rounded-lg transform -rotate-2">
                            {giveawayData?.prize}
                        </div>
                        <div className="mt-12 text-2xl text-gray-400">
                            Sorteando... 🎲
                        </div>
                    </motion.div>
                )}

                {/* STATE: GIVEAWAY WINNER */}
                {giveawayState === "WINNER" && (
                    <motion.div
                        key="winner"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                        className="text-center"
                    >
                        <h2 className="text-4xl text-yellow-400 font-bold mb-4 uppercase tracking-widest">
                            Vencedor(a)
                        </h2>

                        <div className="bg-gradient-to-tr from-yellow-400 to-orange-500 text-black p-16 rounded-full w-[500px] h-[500px] flex flex-col items-center justify-center mx-auto shadow-[0_0_100px_rgba(255,165,0,0.5)] border-8 border-white">
                            <h1 className="text-7xl font-black mb-2 text-center leading-tight">
                                {giveawayData?.winner?.name}
                            </h1>
                            <p className="text-2xl font-bold opacity-80 mt-4">
                                Prêmio: {giveawayData?.prize}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PresentationPage;
