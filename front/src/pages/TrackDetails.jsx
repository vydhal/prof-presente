import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tracksAPI } from "../lib/api";
import {
    Loader2,
    ArrowRight,
    CheckCircle,
    GraduationCap,
    LayoutDashboard,
    Share2,
    Calendar,
    MapPin,
    Tag,
    BookOpen,
    CheckCircle2,
    Clock,
    ChevronRight,
    AlertCircle,
    Facebook,
    Twitter,
    Linkedin,
    Link as LinkIcon
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { getAssetUrl } from "../lib/utils";
import PublicLayout from "../components/PublicLayout";

const TrackDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: track, isLoading, isError } = useQuery({
        queryKey: ["track", id],
        queryFn: async () => {
            const response = await tracksAPI.getById(id);
            return response.data;
        },
        retry: 1
    });

    // Verifica inscrição se usuário estiver logado
    const { data: myTracks, isLoading: isLoadingMyTracks } = useQuery({
        queryKey: ["my-tracks"],
        queryFn: async () => {
            const response = await tracksAPI.getMy();
            return response.data;
        },
        enabled: !!user,
    });

    const enrollment = myTracks?.find(t => t.trackId === id);
    const isEnrolled = !!enrollment;

    const enrollMutation = useMutation({
        mutationFn: () => tracksAPI.enroll(id),
        onSuccess: (data) => {
            toast.success("Inscrição na trilha realizada com sucesso!");
            queryClient.invalidateQueries(["track", id]);
            queryClient.invalidateQueries(["my-tracks"]);

            // Se tiver eventos lotados, avisa o usuário
            if (data.data?.fullEvents?.length > 0) {
                toast.warning(`${data.data.fullEvents.length} eventos desta trilha estão lotados e você ficou na lista de espera.`, {
                    duration: 5000
                });
            }
        },
        onError: (error) => {
            const msg = error.response?.data?.error || "Erro ao realizar inscrição na trilha.";
            toast.error(msg);
        }
    });

    const handleEnroll = () => {
        if (!user) {
            navigate(`/login?redirect=/tracks/${id}`);
            return;
        }
        enrollMutation.mutate();
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Link copiado para a área de transferência!");
        } catch (err) {
            toast.error("Não foi possível copiar o link.");
        }
    };

    const handleNativeShare = async () => {
        const url = window.location.href;
        const title = track?.title || "Trilha EduAgenda";
        const text = `Confira esta trilha de aprendizado: ${title}`;

        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
            } catch (err) {
                console.log("Erro ao compartilhar", err);
            }
        }
    };

    if (isLoading) {
        return (
            <PublicLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#137fec]" />
                </div>
            </PublicLayout>
        );
    }

    if (isError || !track) {
        return (
            <PublicLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500">
                    <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
                    <h2 className="text-xl font-bold dark:text-white mb-2">Trilha não encontrada</h2>
                    <Link to="/tracks" className="text-[#137fec] hover:underline">Ver todas as trilhas</Link>
                </div>
            </PublicLayout>
        );
    }

    const bgImage = track.imageUrl
        ? getAssetUrl(track.imageUrl)
        : "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop";

    return (
        <PublicLayout>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Navigation / Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <Link to="/" className="hover:text-[#137fec]">Início</Link>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                    <Link to="/tracks" className="hover:text-[#137fec]">Trilhas</Link>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                    <span className="text-slate-900 dark:text-slate-100 font-medium truncate">{track.title}</span>
                </nav>

                {/* Hero Section */}
                <div className="relative w-full min-h-[400px] rounded-3xl overflow-hidden mb-12 shadow-2xl group bg-slate-900">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10"></div>
                    <img
                        src={bgImage}
                        alt={track.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="relative z-20 p-8 md:p-16 h-full flex flex-col justify-center max-w-4xl space-y-6">
                        <Badge className="w-fit bg-[#137fec] hover:bg-[#137fec] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                            Trilha de Formação
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-xl">
                            {track.title}
                        </h1>
                        <p className="text-xl text-slate-200 leading-relaxed font-medium max-w-2xl">
                            {track.description}
                        </p>

                        <div className="pt-6 flex flex-wrap gap-4">
                            {isEnrolled ? (
                                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                    <Button disabled className="bg-emerald-500 text-white font-bold py-7 px-8 rounded-2xl gap-3 text-lg opacity-100">
                                        <CheckCircle2 className="w-6 h-6" />
                                        Inscrito nesta Trilha
                                    </Button>
                                    <Link to="/dashboard">
                                        <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md font-bold py-7 px-8 rounded-2xl gap-3 text-lg w-full sm:w-auto">
                                            <LayoutDashboard className="w-6 h-6" />
                                            Minha Área de Treino
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleEnroll}
                                    disabled={enrollMutation.isLoading}
                                    className="bg-[#137fec] hover:bg-blue-600 text-white font-bold py-7 px-10 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center gap-3 text-lg transition-all active:scale-95"
                                >
                                    {enrollMutation.isLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            {user ? "Confirmar Inscrição na Trilha" : "Garantir Minha Vaga Gratuitamente"}
                                            <ArrowRight className="w-6 h-6" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        {!user && (
                            <p className="text-white/60 text-sm italic">
                                * É necessário estar logado para se inscrever.
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content: Journey Map */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="flex items-center gap-3 border-l-4 border-[#137fec] pl-4 uppercase tracking-tighter">
                            <BookOpen className="w-6 h-6 text-[#137fec]" />
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Jornada de Aprendizado</h2>
                        </div>

                        <div className="relative space-y-8 pl-8 md:pl-12">
                            {/* Vertical Line */}
                            <div className="absolute left-[15px] md:left-[21px] top-4 bottom-4 w-1 bg-gradient-to-b from-[#137fec] via-[#137fec]/50 to-slate-200 dark:to-slate-800 rounded-full" />

                            {track.events?.map((trackEvent, index) => {
                                const event = trackEvent.event;
                                const isPast = new Date(event.endDate) < new Date();

                                return (
                                    <div key={trackEvent.id} className="relative group">
                                        {/* Circle Indicator */}
                                        <div className={`absolute -left-[32px] md:-left-[44px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 z-10 flex items-center justify-center transition-all duration-300 ${isPast ? 'bg-slate-300' : 'bg-[#137fec]'}`}>
                                            <span className="text-white text-[10px] font-bold">{index + 1}</span>
                                        </div>

                                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#137fec] transition-colors">{event.title}</h3>
                                                    {isPast && <Badge variant="secondary" className="text-[10px]">Encerrado</Badge>}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-500">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-[#137fec]" />
                                                        <span>{new Date(event.startDate).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-[#137fec]" />
                                                        <span className="truncate max-w-[200px]">{event.location}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Link to={`/events/${event.id}`}>
                                                <Button variant="outline" className="rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 gap-2 w-full md:w-auto whitespace-nowrap">
                                                    Detalhes do Evento
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-8">
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-xl shadow-slate-100/50 dark:shadow-none space-y-6">
                            <h3 className="text-xl font-bold dark:text-white">Resumo da Trilha</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Clock className="w-5 h-5" />
                                        <span>Duração estimada</span>
                                    </div>
                                    <span className="font-bold">Várias sessões</span>
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Tag className="w-5 h-5" />
                                        <span>Total de etapas</span>
                                    </div>
                                    <span className="font-bold text-[#137fec]">{track._count?.events || 0} cursos</span>
                                </div>

                                <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <GraduationCap className="w-5 h-5" />
                                        <span>Certificação</span>
                                    </div>
                                    <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50">Inclusa</Badge>
                                </div>
                            </div>

                            {!isEnrolled && (
                                <div className="bg-[#137fec]/5 p-4 rounded-2xl border border-[#137fec]/10 space-y-2">
                                    <p className="text-xs font-bold text-[#137fec] uppercase">Nota Importante</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Ao se inscrever na trilha, você será matriculado automaticamente em todas as etapas disponíveis desta jornada.
                                    </p>
                                </div>
                            )}

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full gap-2 rounded-xl py-6 border-slate-200">
                                        <Share2 className="w-4 h-4" />
                                        Compartilhar Trilha
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <DialogHeader>
                                        <DialogTitle className="text-slate-900 dark:text-white">Compartilhar Trilha</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex items-center justify-center gap-4 py-6">
                                        <Button variant="outline" size="icon" className="rounded-full w-12 h-12" onClick={() => window.open(`https://api.whatsapp.com/send?text=Confira esta trilha de aprendizado: ${track?.title} ${window.location.href}`, '_blank')}>
                                            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12c0 2.17.69 4.18 1.86 5.82L3 22l4.24-.85C8.82 22.31 10.36 23 12 23c6.07 0 11-4.93 11-11S18.07 2 12 2zm5.72 15.34c-.26.74-1.51 1.4-2.09 1.46-.53.06-1.22.18-3.41-.73-2.63-1.08-4.32-3.8-4.46-3.98-.13-.18-1.07-1.42-1.07-2.71s.67-1.92.9-2.16c.23-.24.5-.3.67-.3h.34c.17 0 .4.06.63.63.24.6.82 2.01.9 2.19.07.18.12.39 0 .63-.12.24-.18.39-.37.6-.18.21-.39.46-.55.63-.18.2-.38.42-.16.8 1.13 1.95 2.5 2.66 3.61 3.23.4.21.64.18.88-.06.24-.24 1.05-1.22 1.33-1.64.28-.42.56-.35.94-.21.38.14 2.41 1.14 2.82 1.34.41.2.68.31.78.48.1.17.1.98-.16 1.72z" clipRule="evenodd" /></svg>
                                        </Button>
                                        <Button variant="outline" size="icon" className="rounded-full w-12 h-12" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}>
                                            <Facebook className="w-6 h-6 text-blue-600" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="rounded-full w-12 h-12" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(track?.title)}`, '_blank')}>
                                            <Twitter className="w-6 h-6 text-sky-500" />
                                        </Button>
                                        <Button variant="outline" size="icon" className="rounded-full w-12 h-12" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}>
                                            <Linkedin className="w-6 h-6 text-blue-700" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button onClick={copyToClipboard} variant="secondary" className="w-full gap-2">
                                            <LinkIcon className="w-4 h-4" />
                                            Copiar Link
                                        </Button>
                                        <Button onClick={handleNativeShare} variant="secondary" className="w-full gap-2 lg:hidden">
                                            <Share2 className="w-4 h-4" />
                                            Compartilhar via Celular
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Support box */}
                        <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-4 shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="font-black text-xl mb-2 italic uppercase">Dúvidas?</h4>
                                <p className="text-sm text-slate-400 mb-6">Estamos aqui para ajudar você a escolher sua melhor jornada.</p>
                                <a href="mailto:suporte@eduagenda.com.br" className="text-sm font-bold text-[#137fec] hover:underline underline-offset-4">
                                    suporte@eduagenda.com.br
                                </a>
                            </div>
                            <GraduationCap className="absolute -right-8 -bottom-8 w-40 h-40 text-white/5 rotate-12" />
                        </div>
                    </aside>
                </div>
            </main>
        </PublicLayout>
    );
};

export default TrackDetails;
