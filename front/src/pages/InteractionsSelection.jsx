import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { eventsAPI } from "../lib/api";
import { Loader2, Calendar, MapPin, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { getAssetUrl } from "../lib/utils";

const InteractionsSelection = () => {
    const { data: eventsData, isLoading } = useQuery({
        queryKey: ["events"],
        queryFn: async () => {
            const res = await eventsAPI.getAll();
            return res.data;
        }
    });

    const events = eventsData?.events || [];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#137fec]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] py-8 font-sans text-slate-900 dark:text-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Interações em Tempo Real</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Escolha um evento para enviar perguntas e participar de sorteios.</p>
                </div>

                {/* Event List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-slate-400">
                            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Nenhum evento disponível no momento.</p>
                        </div>
                    ) : (
                        events.map((event) => {
                            const bgImage = event.imageUrl
                                ? getAssetUrl(event.imageUrl)
                                : "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop";

                            return (
                                <div key={event.id} className="bg-white dark:bg-[#1e293b] rounded-xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all">
                                    <div className="h-40 relative">
                                        <img src={bgImage} className="w-full h-full object-cover" alt={event.title} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-4 left-4 text-white">
                                            <h3 className="font-bold text-lg leading-tight line-clamp-2">{event.title}</h3>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-[#137fec]" />
                                                <span>{new Date(event.startDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-[#137fec]" />
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                        </div>

                                        <Link to={`/interactions/${event.id}`}>
                                            <Button className="w-full bg-[#137fec] hover:bg-blue-600 text-white font-bold gap-2">
                                                Entrar na Sala <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
};

export default InteractionsSelection;
