import { useState, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { Trophy, Gift, X } from "lucide-react";
import confetti from "canvas-confetti"; // Precisa instalar ou remover se não quiser

const GiveawayDisplay = ({ eventId }) => {
    const socket = useSocket();
    const [giveawayState, setGiveawayState] = useState("idle"); // idle, rolling, winner, error
    const [currentPrize, setCurrentPrize] = useState("");
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        if (!socket || !eventId) return;

        socket.on("giveaway_started", ({ prize }) => {
            setGiveawayState("rolling");
            setCurrentPrize(prize);
            setWinner(null);
        });

        socket.on("giveaway_winner", ({ winner, prize }) => {
            setGiveawayState("winner");
            setWinner(winner);
            setCurrentPrize(prize);
            triggerConfetti();
        });

        socket.on("giveaway_error", ({ message }) => {
            // toast.error(message);
            setGiveawayState("idle");
        });

        return () => {
            socket.off("giveaway_started");
            socket.off("giveaway_winner");
            socket.off("giveaway_error");
        };
    }, [socket, eventId]);

    const triggerConfetti = () => {
        // Verificar se canvas-confetti está disponível, se não, pular
        if (typeof confetti === 'function') {
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
        }
    };

    const handleClose = () => {
        setGiveawayState("idle");
        setWinner(null);
    };

    if (giveawayState === "idle") return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700 relative">

                {/* Close Button if Winner */}
                {giveawayState === "winner" && (
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}

                <div className="p-8 text-center space-y-6">

                    {/* Icon / Image */}
                    <div className="mx-auto w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        {giveawayState === "rolling" ? (
                            <Gift className="w-12 h-12 text-amber-500 animate-bounce" />
                        ) : (
                            <Trophy className="w-12 h-12 text-amber-500" />
                        )}
                    </div>

                    {/* Texts */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wide">
                            {giveawayState === "rolling" ? "Sorteando..." : "Temos um Vencedor!"}
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300">
                            Prêmio: <span className="font-bold text-[#137fec]">{currentPrize}</span>
                        </p>
                    </div>

                    {/* Winner Name */}
                    {giveawayState === "winner" && winner && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800 animate-in zoom-in duration-500">
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2">Parabéns</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{winner.name}</p>
                        </div>
                    )}

                    {/* Loading Animation */}
                    {giveawayState === "rolling" && (
                        <div className="flex justify-center gap-2">
                            <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce delay-0"></div>
                            <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                            <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce delay-300"></div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default GiveawayDisplay;
