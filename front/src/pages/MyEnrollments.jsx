import { useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import api from "../lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Calendar, MapPin, Clock, Star, Download, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";

const MyEnrollments = () => {
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["my-enrollments", statusFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get("/enrollments/my-enrollments", {
        params: {
          page: pageParam,
          limit: 6,
          status:
            statusFilter === "all" ? undefined : statusFilter.toUpperCase(),
        },
      });
      return response.data;
    },
    enabled: statusFilter !== "certificates",
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
  });

  const { user } = useAuth();
  const enrollments = data?.pages.flatMap((page) => page.enrollments) ?? [];

  // Busca de Certificados
  const { data: certificates, isLoading: isLoadingCertificates } = useQuery({
    queryKey: ["my-certificates"],
    queryFn: async () => {
      const response = await api.get("/certificates/my");
      return response.data;
    },
    enabled: statusFilter === "certificates",
  });

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
      APPROVED: { label: "Aprovada", color: "bg-green-100 text-green-800" },
      REJECTED: { label: "Rejeitada", color: "bg-red-100 text-red-800" },
      CANCELLED: { label: "Cancelada", color: "bg-gray-100 text-gray-800" },
    };
    return statusConfig[status] || statusConfig.PENDING;
  };

  const EnrollmentCard = ({ enrollment }) => {
    const statusBadge = getStatusBadge(enrollment.status);
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg line-clamp-2">
                {enrollment.event.title}
              </CardTitle>
              {enrollment.event.isPrivate && (
                <Badge variant="secondary">Privado</Badge>
              )}
            </div>
            <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
          </div>
          <CardDescription className="line-clamp-3">
            {enrollment.event.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formatDate(enrollment.event.startDate)}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="line-clamp-1">{enrollment.event.location}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>Inscrito em {formatDate(enrollment.enrollmentDate)}</span>
            </div>
            <div className="pt-2 flex gap-2">
              <Link to={`/events/${enrollment.event.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Ver evento
                </Button>
              </Link>
              {enrollment.status === "APPROVED" &&
                !enrollment.courseEvaluation && (
                  <Link
                    to={`/evaluate/${enrollment.id}`}
                    id="evaluate-enrollment-button"
                  >
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Star className="h-4 w-4" />
                      Avaliar
                    </Button>
                  </Link>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  const CertificateCard = ({ certificate }) => {
    const title = certificate.event?.title || certificate.track?.title || "Certificado";
    const date = certificate.event?.startDate ? formatDate(certificate.event.startDate) : formatDate(certificate.createdAt);
    const downloadUrl = certificate.eventId 
      ? `${api.defaults.baseURL}/certificates/event/${certificate.eventId}/user/${user.id}`
      : `${api.defaults.baseURL}/certificates/track/${certificate.trackId}/user/${user.id}`;

    const handleDownload = async () => {
      try {
        const response = await api.get(downloadUrl, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `certificado_${title.replace(/\s+/g, '_')}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Erro ao baixar certificado:", err);
        alert("Erro ao baixar o certificado. Por favor, tente novamente.");
      }
    };

    return (
      <Card className="hover:shadow-lg transition-shadow border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-primary/10 rounded-lg text-primary">
                 <Award className="h-6 w-6" />
               </div>
               <CardTitle className="text-lg line-clamp-2">
                {title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Conquistado em: {date}</span>
            </div>
            <Button 
               className="w-full flex items-center gap-2" 
               onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download Certificado (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading && !data) {
    return <div>Carregando inscrições...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Erro ao carregar inscrições: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Minhas Inscrições</h1>

      {/* ===== A CORREÇÃO ESTÁ AQUI ===== */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
          <TabsList className="inline-flex w-auto space-x-2 sm:grid sm:w-full sm:grid-cols-5">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="approved">Aprovadas</TabsTrigger>
            <TabsTrigger value="certificates" className="text-primary font-bold">
              <Award className="h-4 w-4 mr-2" />
              Meus Certificados
            </TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
            <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
          </TabsList>
        </div>

        {/* Usamos um único TabsContent que será atualizado dinamicamente */}
        <TabsContent value="certificates" className="mt-4">
          {isLoadingCertificates ? (
             <p>Carregando certificados...</p>
          ) : !certificates || certificates.length === 0 ? (
            <div className="text-center py-12">
               <p className="text-gray-600 mb-4">Você ainda não possui certificados disponíveis para download.</p>
               <p className="text-sm text-gray-400">Certificados são gerados após o encerramento do evento e confirmação de sua participação.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {certificates.map((cert) => (
                 <CertificateCard key={cert.id} certificate={cert} />
               ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value={statusFilter} className="mt-4">
          {statusFilter !== "certificates" && (
            isLoading && enrollments.length === 0 ? (
              <p>Carregando...</p>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {statusFilter === "all"
                    ? "Você ainda não se inscreveu em nenhum evento."
                    : `Nenhuma inscrição com o status "${statusFilter}".`}
                </p>
                <Link to="/events">
                  <Button>Explorar eventos</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrollments.map((enrollment) => (
                    <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                </div>
                <div className="flex justify-center mt-6">
                  {hasNextPage && (
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? "Carregando..." : "Carregar Mais"}
                    </Button>
                  )}
                </div>
              </>
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyEnrollments;
