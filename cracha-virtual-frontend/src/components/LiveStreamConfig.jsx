import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Video, Loader2, Save, ExternalLink } from "lucide-react";

// Aceita o link completo (varios formatos do YouTube) ou so o ID e devolve so o ID.
const extractYoutubeId = (input) => {
    if (!input) return "";
    const trimmed = input.trim();

    const patterns = [
        /(?:youtube\.com\/(?:live|watch|embed)\/?(?:\?v=)?)([a-zA-Z0-9_-]{6,})/,
        /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    ];

    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) return match[1];
    }

    // Nao bateu com nenhum padrao de URL - assume que ja e o ID puro
    return trimmed;
};

const LiveStreamConfig = ({ eventId }) => {
    const queryClient = useQueryClient();
    const [streamId, setStreamId] = useState("");
    const [status, setStatus] = useState("SCHEDULED");

    const { data: liveStream, isLoading } = useQuery({
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

    useEffect(() => {
        if (liveStream) {
            setStreamId(liveStream.streamId || "");
            setStatus(liveStream.status || "SCHEDULED");
        }
    }, [liveStream]);

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post(`/live-streams/events/${eventId}`, data);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success("Configuração de transmissão salva!");
            setStreamId(data.streamId || "");
            queryClient.invalidateQueries(["liveStream", eventId]);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || "Erro ao salvar transmissão");
        },
    });

    const handleSave = (e) => {
        e.preventDefault();
        const cleanId = extractYoutubeId(streamId);
        saveMutation.mutate({ provider: "YOUTUBE", streamId: cleanId, status });
    };

    if (isLoading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin w-5 h-5 text-accent" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Video className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-semibold">Transmissão Online</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
                A transmissão é criada e gerenciada fora da plataforma (ex: StreamYard, que publica direto no seu canal do YouTube). Aqui você só cola o link ou ID do vídeo gerado para vincular ao evento.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-lg bg-slate-50 flex flex-col justify-center items-center text-center space-y-3">
                    <ExternalLink className="w-8 h-8 text-slate-400" />
                    <h4 className="font-semibold text-gray-800">Criar a transmissão</h4>
                    <p className="text-xs text-gray-600">
                        Abra o StreamYard, inicie a live conectada ao seu YouTube e copie o link do vídeo gerado.
                    </p>
                    <Button asChild variant="outline" className="w-full">
                        <a href="https://streamyard.com/" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Abrir StreamYard
                        </a>
                    </Button>
                </div>

                <form onSubmit={handleSave} className="space-y-4 border p-4 rounded-lg bg-gray-50 flex flex-col justify-between">
                    <div className="space-y-2">
                        <Label htmlFor="streamId">Link ou ID do Vídeo do YouTube</Label>
                        <Input
                            id="streamId"
                            placeholder="Cole aqui o link do YouTube (ou só o ID)"
                            value={streamId}
                            onChange={(e) => setStreamId(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status da Transmissão</Label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent p-2 text-sm"
                        >
                            <option value="SCHEDULED">Agendado (Aguardando Início)</option>
                            <option value="LIVE">Ao Vivo Agora</option>
                            <option value="ENDED">Encerrada</option>
                        </select>
                    </div>

                    <Button type="submit" disabled={saveMutation.isPending || !streamId} className="w-full">
                        {saveMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Transmissão
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default LiveStreamConfig;
