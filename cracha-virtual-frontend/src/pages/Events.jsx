import { useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "../hooks/useDebounce";
import api from "../lib/api";
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
import { Separator } from "../components/ui/separator";
import { Calendar, MapPin, Users, Search } from "lucide-react";
import { getAssetUrl } from "../lib/utils";

// --- NOVO: Componente de Card Reutilizável ---
const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  };

  const getEventStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const buffer = 4 * 60 * 60 * 1000; // 4 horas em ms

    if (now < start)
      return { label: "Próximo", color: "bg-blue-100 text-blue-800" };

    if (now >= start && now <= new Date(end.getTime() + buffer))
      return {
        label: now <= end ? "Em andamento" : "Finalizado (Recente)",
        color: now <= end ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
      };

    return { label: "Finalizado", color: "bg-gray-100 text-gray-800" };
  };

  const eventStatus = getEventStatus(event.startDate, event.endDate);

  // Constrói a URL completa da imagem
  const eventImageUrl = getAssetUrl(event.imageUrl); // <-- USE A FUNÇÃO AQUI

  return (
    <Card className="hover:shadow-lg transition-shadow flex flex-col">
      {/* --- IMAGEM ADICIONADA AQUI --- */}
      {eventImageUrl ? (
        <img
          src={eventImageUrl}
          alt={event.title}
          className="w-full object-cover" // Ajuste a altura (h-40) como preferir
        />
      ) : (
        // Placeholder se não houver imagem
        <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
          <Calendar className="h-12 w-12 text-gray-400" />
        </div>
      )}
      {/* --- FIM DA IMAGEM --- */}
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg line-clamp-2">
              {event.title}
            </CardTitle>
            {event.isPrivate && <Badge variant="secondary">Privado</Badge>}
          </div>
          <Badge className={eventStatus.color}>{eventStatus.label}</Badge>
        </div>
        <CardDescription className="line-clamp-3 h-[60px]">
          {event.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          {event.maxAttendees && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              <span>
                {event.enrolledCount || 0} inscritos de {event.maxAttendees}{" "}
                vagas
              </span>
            </div>
          )}
        </div>
        <div className="pt-4">
          <Link to={`/events/${event.id}`}>
            <Button className="w-full">Ver detalhes</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

const Events = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["events", debouncedSearchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get("/events", {
        params: {
          page: pageParam,
          limit: 9,
          search: debouncedSearchTerm,
          upcoming: true,
        },
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
  });

  const allEvents = data?.pages.flatMap((page) => page.events) ?? [];

  // --- LÓGICA DE SEPARAÇÃO DOS EVENTOS ---
  const privateEvents = allEvents.filter((event) => event.isPrivate);
  const publicEvents = allEvents.filter((event) => !event.isPrivate);

  if (isLoading && allEvents.length === 0) {
    return <div className="p-6">Carregando eventos...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">
          Erro ao carregar eventos: {error.message}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Eventos</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Pesquisar por título, descrição ou local..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {allEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {debouncedSearchTerm
              ? "Nenhum evento encontrado para sua pesquisa."
              : "Nenhum evento disponível para você no momento."}
          </p>
        </div>
      ) : (
        <>
          {/* --- NOVA SEÇÃO DE EVENTOS PRIVADOS --- */}
          {privateEvents.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Eventos da sua Unidade</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {privateEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {privateEvents.length > 0 && publicEvents.length > 0 && <Separator />}

          {/* --- NOVA SEÇÃO DE EVENTOS PÚBLICOS --- */}
          {publicEvents.length > 0 && (
            <section id="events-list" className="space-y-4">
              {" "}
              <h2 className="text-2xl font-bold">Eventos Públicos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Botão de Paginação "Carregar Mais" */}
      <div className="flex justify-center mt-6">
        {hasNextPage && (
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Carregando..." : "Carregar Mais"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Events;
