import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tracksAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Loader2, GraduationCap, MapPin, Calendar, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../components/ui/dialog';
import { Link } from 'react-router-dom';

const MyTracks = () => {
    const queryClient = useQueryClient();
    const [selectedTrack, setSelectedTrack] = React.useState(null);

    const handleDownloadCertificate = (trackId) => {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id;
        if (!userId) {
            toast.error('Erro ao identificar usuário');
            return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'https://eduagenda.simplisoft.com.br/api';
        window.open(`${apiUrl}/certificates/track/${trackId}/user/${userId}`, '_blank');
    };

    // Buscar minhas trilhas
    const { data: myEnrollments, isLoading: loadingMy } = useQuery({
        queryKey: ['my-tracks'],
        queryFn: async () => {
            const resp = await tracksAPI.getMy();
            return resp.data;
        }
    });

    // Buscar todas as trilhas (para sugestões)
    const { data: allTracks, isLoading: loadingAll } = useQuery({
        queryKey: ['all-tracks'],
        queryFn: async () => {
            const resp = await tracksAPI.getAll();
            return resp.data;
        }
    });

    // Mutação para se inscrever
    const enrollMutation = useMutation({
        mutationFn: (trackId) => tracksAPI.enroll(trackId),
        onSuccess: () => {
            queryClient.invalidateQueries(['my-tracks']);
            toast.success('Inscrição realizada com sucesso!');
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Erro ao se inscrever');
        }
    });

    const isLoading = loadingMy || loadingAll;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Carregando suas trilhas...</p>
            </div>
        );
    }

    // Filtrar trilhas que eu ainda não estou inscrito
    const myTrackIds = myEnrollments?.map(e => e.trackId) || [];
    const availableTracks = allTracks?.filter(t => !myTrackIds.includes(t.id)) || [];

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <GraduationCap className="w-6 h-6 text-blue-500" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Formação Continuada</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-lg">Acompanhe seu progresso nas trilhas de conhecimento.</p>
            </header>

            {/* MINHAS TRILHAS ATIVAS */}
            <section className="mb-16">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        Minhas Trilhas
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {myEnrollments?.length || 0}
                        </Badge>
                    </h2>
                </div>

                {myEnrollments?.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
                        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Nenhuma trilha iniciada</h3>
                        <p className="text-slate-500 mt-2 italic">Escolha uma trilha abaixo para começar sua jornada.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {myEnrollments?.map((enrollment, idx) => (
                                <motion.div
                                    key={enrollment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Card className="overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
                                        <div className="h-40 bg-slate-100 dark:bg-slate-900 relative">
                                            {enrollment.track.imageUrl ? (
                                                <img
                                                    src={enrollment.track.imageUrl}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    alt={enrollment.track.title}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                                                    <GraduationCap className="w-16 h-16 text-white/20" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4">
                                                {enrollment.isCompleted ? (
                                                    <Badge className="bg-green-500 text-white border-none px-3 py-1 flex gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Concluído
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-blue-500 text-white border-none px-3 py-1">
                                                        Em Progresso
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-xl font-black tracking-tight group-hover:text-blue-500 transition-colors">
                                                {enrollment.track.title}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-2 min-h-[3rem]">
                                                {enrollment.track.description}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                                                    <span>Progresso</span>
                                                    <span className={`${enrollment.isCompleted ? 'text-green-500' : 'text-blue-500'}`}>
                                                        {Math.round(enrollment.progress)}%
                                                    </span>
                                                </div>
                                                <Progress value={enrollment.progress} className={`h-2 ${enrollment.isCompleted ? 'bg-green-100 dark:bg-green-950/30' : ''}`} />
                                            </div>

                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                                <ArrowRight className="w-4 h-4 text-blue-500" />
                                                <span>{enrollment.track._count.events} Etapas no total</span>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="pt-0">
                                            <Button
                                                variant="outline"
                                                onClick={() => enrollment.isCompleted
                                                    ? handleDownloadCertificate(enrollment.trackId)
                                                    : setSelectedTrack(enrollment)
                                                }
                                                className="w-full rounded-xl font-bold group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all font-bold"
                                            >
                                                {enrollment.isCompleted ? 'Visualizar Certificado' : 'Ver Minha Jornada'}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </section>

            {/* TRILHAS DISPONÍVEIS */}
            {availableTracks.length > 0 && (
                <section>
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold">Trilhas Disponíveis</h2>
                        <p className="text-slate-500">Explore novas formações para sua trilha profissional.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {availableTracks.map((track, idx) => (
                            <motion.div
                                key={track.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                            >
                                <Card className="h-full flex flex-col border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden group">
                                    <div className="h-32 bg-slate-200 dark:bg-slate-900 overflow-hidden">
                                        {track.imageUrl ? (
                                            <img src={track.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                                                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                                            </div>
                                        )}
                                    </div>
                                    <CardHeader className="flex-1 pb-4">
                                        <CardTitle className="text-lg font-bold leading-tight line-clamp-2">{track.title}</CardTitle>
                                        <CardDescription className="line-clamp-3 text-xs leading-relaxed">
                                            {track.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pb-4 pt-0">
                                        <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
                                            <span>{track._count.events} Etapas</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Button
                                            onClick={() => enrollMutation.mutate(track.id)}
                                            disabled={enrollMutation.isLoading}
                                            className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 font-black rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-all"
                                        >
                                            {enrollMutation.isLoading && enrollMutation.variables === track.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                'Começar Agora'
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}
            {/* MODAL DE JORNADA */}
            <Dialog open={!!selectedTrack} onOpenChange={() => setSelectedTrack(null)}>
                <DialogContent className="max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Sua Jornada</DialogTitle>
                        <DialogDescription>
                            Complete todos os eventos abaixo para concluir a trilha: <br />
                            <span className="font-bold text-blue-500">{selectedTrack?.track.title}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {selectedTrack?.track?.events?.map((te, index) => {
                            const isDone = te.event?.userCheckins?.length > 0;
                            return (
                                <div
                                    key={te.id || `${te.trackId}-${te.eventId}`}
                                    className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${isDone
                                        ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30'
                                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
                                        }`}
                                >
                                    <div className={`mt-1 p-1.5 rounded-full ${isDone ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                        }`}>
                                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 flex items-center justify-center font-bold text-[10px]">{index + 1}</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-bold text-sm line-clamp-1 ${isDone ? 'text-green-700 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                            {te.event?.title}
                                        </h4>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {te.event?.startDate ? new Date(te.event.startDate).toLocaleDateString() : 'Data não definida'}
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {te.event?.location || 'Local não definido'}
                                            </p>
                                        </div>
                                    </div>
                                    {!isDone && te.event?.id && (
                                        <Link to={`/events/${te.event.id}`}>
                                            <Button size="sm" variant="ghost" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 h-8">
                                                Ver Evento
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            );
                        }) || (
                                <div className="text-center py-8 text-slate-500 italic">
                                    Nenhum evento vinculado a esta trilha.
                                </div>
                            )}
                    </div>

                    <DialogFooter>
                        <Button
                            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            onClick={() => setSelectedTrack(null)}
                        >
                            Entendido
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyTracks;
