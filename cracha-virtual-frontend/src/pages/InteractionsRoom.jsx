import React from "react";
import { useParams, Link } from "react-router-dom";
import InteractionsTab from "../components/InteractionsTab";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { eventsAPI, enrollmentsAPI } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import GiveawayDisplay from "../components/Interactions/GiveawayDisplay";

const InteractionsRoom = () => {
    const { id } = useParams();
    const { user } = useAuth();

    // Fetch event details for context
    const { data: event } = useQuery({
        queryKey: ["event", id],
        queryFn: async () => {
            const response = await eventsAPI.getById(id);
            return response.data;
        },
        enabled: !!id
    });

    // Check enrollment (to pass to InteractionsTab)
    const { data: enrollmentData } = useQuery({
        queryKey: ["enrollment-status", id, user?.id],
        queryFn: async () => {
            if (!user) return null;
            const response = await enrollmentsAPI.getUserEnrollments(user.id);
            const enrollments = response.data?.enrollments || response.data || [];
            return enrollments.find(e => e.eventId === id);
        },
        enabled: !!user && !!id,
    });

    const isEnrolled = !!enrollmentData;
    const isApproved = enrollmentData?.status === 'APPROVED';

    return (
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-sans text-slate-900 dark:text-slate-100 flex flex-col">
            {/* Include Giveaway Display here since it's the room view */}
            <GiveawayDisplay eventId={id} />

            {/* Header */}
            <header className="bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-800 p-4 shadow-sm sticky top-0 z-40">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/interactions">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">{event?.title || "Sala de Interação"}</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {user ? `Logado como ${user.name}` : "Modo Visitante"}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full p-4 pb-20">
                <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 p-4 md:p-6">
                    <InteractionsTab eventId={id} isEnrollmentApproved={isEnrolled && isApproved} />
                </div>
            </main>
        </div>
    );
};

export default InteractionsRoom;
