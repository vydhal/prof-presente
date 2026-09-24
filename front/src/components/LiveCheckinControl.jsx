import React, { useEffect } from "react";
import api from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../contexts/SocketContext";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { CheckCircle2, Loader2, PlayCircle, StopCircle, Users } from "lucide-react";

const LiveCheckinControl = ({ eventId, showHeader = true }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const socket = useSocket();

    const { data: liveStream } = useQuery({
        queryKey: ["liveStream", eventId],
        queryFn: async () => {
            try {
                const res = await api.get(`/live-streams/events/${eventId}`);
                return res.data;
            } catch (err) {
                if (err.response?.status === 404) return null;
                throw err;
            }
        },
    });

    const liveStreamId = liveStream?.id;

    const { data: checkinStatus, isLoading } = useQuery({
        queryKey: ["liveCheckinStatus", liveStreamId],
        queryFn: async () => {
            const res = await api.get(`/live-streams/${liveStreamId}/checkin/status`);
            return res.data;
        },
        enabled: !!liveStreamId,
        refetchInterval: 15000, // fallback caso o socket perca algum evento
    });

    useEffect(() => {
        if (!socket || !liveStreamId) return;

        socket.emit("join_live", { liveStreamId, user });

        const refresh = () => queryClient.invalidateQueries(["liveCheckinStatus", liveStreamId]);

        socket.on("checkin_window_opened", refresh);
        socket.on("checkin_window_closed", refresh);
        socket.on("checkin_confirmed_count", refresh);

        return () => {
            socket.emit("leave_live", { liveStreamId });
            socket.off("checkin_window_opened", refresh);
            socket.off("checkin_window_closed", refresh);
            socket.off("checkin_confirmed_count", refresh);
        };
    }, [socket, liveStreamId, user, queryClient]);

    const openMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/live-streams/${liveStreamId}/checkin/open`);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Check-in liberado! Os participantes já podem confirmar presença.");
            queryClient.invalidateQueries(["liveCheckinStatus", liveStreamId]);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || "Erro ao liberar o check-in.");
        },
    });

    const closeMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/live-streams/${liveStreamId}/checkin/close`);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Check-in encerrado.");
            queryClient.invalidateQueries(["liveCheckinStatus", liveStreamId]);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || "Erro ao encerrar o check-in.");
        },
    });

    // Só faz sentido liberar o check-in de uma transmissão já configurada
    if (!liveStream?.streamId) {
        return (
            <div className="border rounded-lg p-4 bg-muted/50 text-sm text-muted-foreground text-center">
                Configure o link ou ID da transmissão (aba Transmissão do evento) antes de liberar o check-in ao vivo.
            </div>
        );
    }

    const isOpen = !!checkinStatus?.open;

    return (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
            {showHeader && (
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Check-in ao Vivo</h3>
                </div>
            )}
            <p className="text-sm text-muted-foreground">
                Libere o check-in durante a transmissão para que os participantes confirmem presença em tempo real.
            </p>

            {isLoading ? (
                <div className="flex justify-center p-2">
                    <Loader2 className="animate-spin w-5 h-5 text-primary" />
                </div>
            ) : isOpen ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 border border-primary/30 rounded-md p-3 bg-primary/10">
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-primary">
                            Check-in aberto desde{" "}
                            {new Date(checkinStatus.window.openedAt).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {checkinStatus.window.confirmationsCount} confirmação(ões)
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={() => closeMutation.mutate()}
                        disabled={closeMutation.isPending}
                    >
                        {closeMutation.isPending ? (
                            <Loader2 className="animate-spin w-4 h-4 mr-2" />
                        ) : (
                            <StopCircle className="w-4 h-4 mr-2" />
                        )}
                        Encerrar Check-in
                    </Button>
                </div>
            ) : (
                <Button
                    onClick={() => openMutation.mutate()}
                    disabled={openMutation.isPending}
                    className="w-full"
                >
                    {openMutation.isPending ? (
                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    ) : (
                        <PlayCircle className="w-4 h-4 mr-2" />
                    )}
                    Liberar Check-in Agora
                </Button>
            )}
        </div>
    );
};

export default LiveCheckinControl;
