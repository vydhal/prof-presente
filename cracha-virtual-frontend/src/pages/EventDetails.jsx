import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsAPI, enrollmentsAPI } from "../lib/api";
import { Loader2, Calendar, MapPin, Mail, ArrowRight, Share2, AlertCircle, LayoutDashboard, CheckCircle, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner"; // Assuming sonner is used for notifications based on context, or use standard alert if not
import { getAssetUrl } from "../lib/utils";

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("about");

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const response = await eventsAPI.getById(id);
      return response.data;
    },
    retry: 1
  });

  // Verifica inscrição se usuário estiver logado
  const { data: enrollmentData, isLoading: isLoadingEnrollment } = useQuery({
    queryKey: ["enrollment-status", id, user?.id],
    queryFn: async () => {
      // Busca inscrições do usuário filtrando por este evento
      // Nota: A API getUserEnrollments pode retornar todas, então filtramos no front se n suportar filtro na API
      // Mas a API.js sugere params. Vamos tentar passar eventId.
      const response = await enrollmentsAPI.getUserEnrollments(user.id);
      const enrollments = response.data?.enrollments || response.data || [];
      // Encontra a inscrição para este evento
      return enrollments.find(e => e.eventId === id);
    },
    enabled: !!user && !!id,
  });

  const isEnrolled = !!enrollmentData;
  const isCreator = user && event && (user.id === event.creatorId || user.role === 'ADMIN' || user.role === 'SPEAKER');

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentsAPI.enroll(id),
    onSuccess: () => {
      toast.success("Inscrição realizada com sucesso!");
      queryClient.invalidateQueries(["event", id]);
      queryClient.invalidateQueries(["enrollment-status", id, user?.id]);
      // navigate("/my-enrollments"); // Opcional: redirecionar ou manter na página
    },
    onError: (error) => {
      const msg = error.response?.data?.message || "Erro ao realizar inscrição.";
      toast.error(msg);
    }
  });

  const handleEnroll = () => {
    if (!user) {
      navigate(`/login?redirect=/events/${id}`);
      return;
    }
    enrollMutation.mutate();
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#137fec]" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex flex-col items-center justify-center text-slate-500">
        <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Evento não encontrado</h2>
        <Link to="/" className="text-[#137fec] hover:underline">Voltar para o início</Link>
      </div>
    );
  }

  // Helper to format date range
  const formatDateRange = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);

    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const startStr = s.toLocaleDateString('pt-BR', options);

    if (s.getDate() === e.getDate() && s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return startStr;
    }

    return `${startStr} - ${e.toLocaleDateString('pt-BR', options)}`;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate status/capacity
  const isFull = event.maxAttendees && event.enrolledCount >= event.maxAttendees;
  const isClosed = new Date(event.endDate) < new Date();
  const canRegister = (!isClosed && !isFull) || isEnrolled; // Se já inscrito, ok (para visualizar)

  // Default image if missing
  const bgImage = event.imageUrl
    ? getAssetUrl(event.imageUrl)
    : "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] text-[#0d141b] dark:text-slate-100 font-sans">
      {/* Componente de Sorteio (Overlay) */}
      {/* Componente de Sorteio (Overlay) - Removido */}

      {/* HEADER: Condicional */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#101922]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="text-[#137fec]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SEDUC <span className="text-[#137fec]">Eventos</span></span>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link to="/dashboard">
                  <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-700">
                    <LayoutDashboard className="w-4 h-4" />
                    Ir para Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button className="bg-[#137fec] hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20">
                    Entrar / Cadastrar-se
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
          <Link to="/" className="hover:text-[#137fec]">Início</Link>
          <span className="text-xs">/</span>
          {user && (
            <>
              <Link to="/events" className="hover:text-[#137fec]">Eventos</Link>
              <span className="text-xs">/</span>
            </>
          )}
          <span className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-[200px] md:max-w-none">{event.title}</span>
        </nav>

        {/* Hero Section */}
        <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden mb-8 shadow-xl group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
          <img
            src={bgImage}
            alt={event.title}
            onError={(e) => console.error("Erro ao carregar imagem de capa:", bgImage, e)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 p-6 md:p-10 z-20">
            <span className="bg-[#137fec] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">
              {/* Categoria seria aqui, mas não temos no BD ainda */}
              Evento
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-4xl drop-shadow-lg">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-12">

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("about")}
                className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "about" ? "border-[#137fec] text-[#137fec]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                Sobre
              </button>
              <button
                onClick={() => setActiveTab("schedule")}
                className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "schedule" ? "border-[#137fec] text-[#137fec]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                Programação
              </button>
              <button
                onClick={() => setActiveTab("speakers")}
                className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === "speakers" ? "border-[#137fec] text-[#137fec]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                Palestrantes
              </button>
            </div>

            {/* Content Sections */}
            <section className="space-y-6 min-h-[300px]">
              {activeTab === "about" && (
                <>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Detalhes</h2>
                  <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </div>
                </>
              )}

              {activeTab === "schedule" && (
                <>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Programação</h2>
                  <div className="space-y-4">
                    {event.schedule ? (
                      event.schedule.split("\n").filter(line => line.trim()).map((line, index) => (
                        <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-[#137fec] shadow-sm flex gap-4">
                          <div className="font-bold text-[#137fec] whitespace-nowrap">
                            {line.match(/^\d{2}:\d{2}/) ? line.substring(0, 5) : "•"}
                          </div>
                          <div className="text-slate-700 dark:text-slate-300">
                            {line.match(/^\d{2}:\d{2}/) ? line.substring(5).replace(/^-/, '').trim() : line}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic">A programação detalhada será divulgada em breve.</p>
                    )}
                  </div>
                </>
              )}

              {activeTab === "speakers" && (
                <>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Palestrantes Confirmados</h2>
                  {event.speakerName ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="w-32 h-32 rounded-full bg-slate-200 overflow-hidden shrink-0 border-4 border-white dark:border-slate-700 shadow-md">
                          {event.speakerPhotoUrl ? (
                            <img
                              src={getAssetUrl(event.speakerPhotoUrl)}
                              alt={event.speakerName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error("Erro Loading Speaker:", getAssetUrl(event.speakerPhotoUrl));
                                e.target.src = ""; // Prevent loop
                                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100"><svg class="w-12 h-12" ...><path d="..." /></svg></div>'; // Fallback manually? Or just let it hide.
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                              <Users className="w-12 h-12" />
                            </div>
                          )}
                        </div>
                        <div className="text-center md:text-left">
                          <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{event.speakerName}</h4>
                          <p className="text-[#137fec] font-medium text-lg">{event.speakerRole}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">Nenhum palestrante cadastrado ainda.</p>
                  )}
                </>
              )}
            </section>

          </div>

          {/* Sidebar Column */}
          <aside className="space-y-6 lg:sticky lg:top-24">

            {/* Registration Card */}
            <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#137fec]/10 text-[#137fec] flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Data e Horário</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                        {formatDateRange(event.startDate, event.endDate)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatTime(event.startDate)} às {formatTime(event.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#137fec]/10 text-[#137fec] flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Local</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{event.location}</p>
                      {/* <p className="text-xs text-slate-500">Campina Grande, PB</p> */}
                    </div>
                  </div>
                </div>

                {/* Mini Map (Static for now) */}
                <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden group border border-slate-200 dark:border-slate-700">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                  ></iframe>
                  <a
                    href={event.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-white dark:bg-slate-900 px-2 py-1 rounded text-[10px] font-bold shadow-sm hover:bg-slate-50 flex items-center gap-1"
                  >
                    Abrir no Maps <Share2 className="w-3 h-3" />
                  </a>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-500 text-sm">Vagas</span>
                    <div className="text-right">
                      {event.maxAttendees ? (
                        <>
                          <span className={`text-xl font-black uppercase ${isFull ? 'text-red-500' : 'text-emerald-500'}`}>
                            {event.enrolledCount} / {event.maxAttendees}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-black text-emerald-500 uppercase">Ilimitadas</span>
                      )}
                    </div>
                  </div>

                  {/* Lógica de Botão de Ação */}
                  {isClosed ? (
                    <Button disabled className="w-full bg-slate-300 text-slate-500 font-bold py-6 rounded-xl cursor-not-allowed">
                      Evento Encerrado
                    </Button>
                  ) : isFull && !isEnrolled ? (
                    <Button disabled className="w-full bg-red-100 text-red-500 font-bold py-6 rounded-xl cursor-not-allowed">
                      Vagas Esgotadas
                    </Button>
                  ) : isEnrolled ? (
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-6 rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-default">
                      <CheckCircle className="w-5 h-5" />
                      Inscrição Confirmada
                    </Button>
                  ) : (
                    <Button
                      onClick={handleEnroll}
                      disabled={enrollMutation.isLoading}
                      className="w-full bg-[#137fec] hover:bg-blue-600 text-white font-bold py-6 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                    >
                      {enrollMutation.isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {user ? "Confirmar Inscrição" : "Garantir Minha Vaga"}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  )}

                  {!user && (
                    <p className="text-center text-[11px] text-slate-400 mt-4 px-4 leading-snug">
                      * Login necessário para realizar a inscrição.
                    </p>
                  )}
                  {user && (
                    <p className="text-center text-[11px] text-slate-400 mt-4 px-4 leading-snug">
                      * Ao confirmar, você garante sua vaga e certificado.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden shadow-xl">
              <div className="relative z-10 space-y-3">
                <h4 className="font-bold">Dúvidas sobre o evento?</h4>
                <p className="text-xs text-slate-300">Entre em contato com a equipe de coordenação.</p>
                <a href="mailto:suporte@educacao.cg.pb.gov.br" className="text-xs font-bold flex items-center gap-2 hover:text-[#137fec] transition-colors">
                  <Mail className="w-4 h-4" />
                  suporte@educacao.cg.pb.gov.br
                </a>
              </div>
              <div className="absolute -right-4 -bottom-4 text-white/5 pointer-events-none">
                <AlertCircle className="w-24 h-24" />
              </div>
            </div>

          </aside>
        </div>
      </main >

      <footer className="bg-white dark:bg-[#101922] border-t border-slate-200 dark:border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-8 h-8 bg-slate-200 rounded-md flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-500">SEDUC Campina Grande</p>
            </div>
            <p className="text-xs text-slate-400">© 2025 Prof Presente. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div >
  );
};

export default EventDetails;
