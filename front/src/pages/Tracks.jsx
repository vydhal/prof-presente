import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "../hooks/useDebounce";
import { tracksAPI } from "../lib/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Search, GraduationCap, MapPin, Calendar, ArrowRight } from "lucide-react";
import { getAssetUrl } from "../lib/utils";
import PublicLayout from "../components/PublicLayout";

const TrackCard = ({ track }) => {
    const trackImageUrl = getAssetUrl(track.imageUrl);
    const eventsCount = track._count?.events || 0;

    return (
        <Card className="hover:shadow-lg transition-all duration-300 flex flex-col group overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="relative h-48 overflow-hidden">
                {trackImageUrl ? (
                    <img
                        src={trackImageUrl}
                        alt={track.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <GraduationCap className="h-12 w-12 text-slate-400" />
                    </div>
                )}
                <div className="absolute top-3 right-3">
                    <Badge className="bg-[#137fec] hover:bg-[#137fec]">
                        {eventsCount} {eventsCount === 1 ? 'Etapa' : 'Etapas'}
                    </Badge>
                </div>
            </div>

            <CardHeader className="flex-1">
                <CardTitle className="text-xl line-clamp-2 group-hover:text-[#137fec] transition-colors">
                    {track.title}
                </CardTitle>
                <CardDescription className="line-clamp-3 text-sm h-[60px]">
                    {track.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="flex flex-col gap-2 mb-4">
                    {/* Mostra um preview dos eventos se existirem */}
                    {track.events?.slice(0, 2).map((te, idx) => (
                        <div key={te.id} className="flex items-center text-xs text-slate-500 gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="truncate">{te.event.title}</span>
                        </div>
                    ))}
                    {eventsCount > 2 && (
                        <span className="text-[10px] text-slate-400 italic">
                            + {eventsCount - 2} outras etapas
                        </span>
                    )}
                </div>

                <Link to={`/tracks/${track.id}`}>
                    <Button className="w-full bg-[#137fec] hover:bg-blue-600 gap-2 rounded-xl group">
                        Ver Detalhes
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
};

const Tracks = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const { data: tracks, isLoading, error } = useQuery({
        queryKey: ["tracks", debouncedSearchTerm],
        queryFn: async () => {
            const response = await tracksAPI.getAll({ search: debouncedSearchTerm });
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <PublicLayout>
                <div className="max-w-7xl mx-auto p-6 md:p-12 flex justify-center py-32">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium">Carregando trilhas de formação...</p>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 space-y-12 font-sans">
                {/* Header Section */}
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
                        Trilhas de <span className="text-[#137fec]">Aprendizado</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400">
                        Jornadas completas de formação para o seu desenvolvimento profissional.
                        Inscreva-se em trilhas estruturadas e acompanhe seu progresso.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 transition-colors group-focus-within:text-[#137fec]" />
                    <Input
                        placeholder="O que você quer aprender hoje? Pesquise por título ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-14 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none focus-visible:ring-[#137fec] text-lg"
                    />
                </div>

                {/* Grid Section */}
                {error ? (
                    <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
                        <p className="text-red-600 font-medium">Erro ao carregar trilhas: {error.message}</p>
                        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 border-red-200 text-red-600 hover:bg-red-50">
                            Tentar novamente
                        </Button>
                    </div>
                ) : tracks?.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <GraduationCap className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhuma trilha encontrada</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">
                            {searchTerm
                                ? "Não encontramos resultados para sua pesquisa. Tente outros termos."
                                : "Ainda não há trilhas de formação disponíveis."}
                        </p>
                        {searchTerm && (
                            <Button onClick={() => setSearchTerm("")} variant="link" className="text-[#137fec] mt-2">
                                Limpar busca
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tracks?.map((track) => (
                            <TrackCard key={track.id} track={track} />
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
};

export default Tracks;
