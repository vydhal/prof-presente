import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../lib/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import {
  Loader2,
  Calendar as CalendarIcon,
  Download,
  Users,
  UserCheck,
  UserX,
  Star,
  MessageSquare,
  List,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Label } from "./ui/label";
import { Combobox } from "./ui/combobox";
import { Separator } from "./ui/separator";

const teachingSegmentOptions = [
  { value: "SUPERIOR", label: "Superior" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "INFANTIL", label: "Ed. Infantil" },
  { value: "FUNDAMENTAL1", label: "Fundamental I" },
  { value: "FUNDAMENTAL2", label: "Fundamental II" },
  { value: "EJA", label: "EJA" },
];

const contractTypeOptions = [
  { value: "EFETIVO", label: "Efetivo" },
  { value: "PRESTADOR", label: "Prestador" },
  { value: "ESTUDANTE", label: "Estudante" },
];

const ReportsDashboard = () => {
  // Estados para o Relatório por Evento
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventReportData, setEventReportData] = useState(null);

  // Estados para o Relatórios
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState("");
  const [workplaceReportData, setWorkplaceReportData] = useState(null);
  const [dateRange, setDateRange] = useState(undefined);
  const [awardsReportData, setAwardsReportData] = useState(null);
  const [selectedEventIdForSummary, setSelectedEventIdForSummary] =
    useState("");
  const [eventSummaryData, setEventSummaryData] = useState(null);

  // NOVOS ESTADOS para o Relatório Filtrado
  const [filters, setFilters] = useState({
    segment: "",
    contractType: "",
    neighborhood: "",
    professionId: "",
  });
  const [filteredReportData, setFilteredReportData] = useState(null);

  // --- BUSCA DE DADOS PARA OS FILTROS ---

  // CORREÇÃO 1: Restaurada a função para buscar eventos
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["allEventsForReport"],
    queryFn: async () => {
      const response = await api.get(
        "/events?limit=500&sortBy=startDate&order=desc"
      );
      return response.data.events;
    },
  });

  // Busca a lista de escolas (workplaces)
  const { data: workplaces, isLoading: isLoadingWorkplaces } = useQuery({
    queryKey: ["allWorkplacesForReport"],
    queryFn: async () => {
      const response = await api.get("/workplaces?limit=500");
      return response.data.workplaces;
    },
  });

  // NOVA BUSCA: Busca a lista de profissões
  const { data: professions, isLoading: isLoadingProfessions } = useQuery({
    queryKey: ["allProfessionsForReport"],
    queryFn: async () => {
      const response = await api.get("/professions?limit=500");
      return response.data.professions;
    },
  });

  // NOVA BUSCA: Busca a lista de bairros para o filtro
  const { data: filterOptions, isLoading: isLoadingFilters } = useQuery({
    queryKey: ["reportFilterOptions"],
    queryFn: async () => {
      const response = await api.get("/reports/filters/options");
      return response.data;
    },
  });

  // --- MUTATIONS PARA GERAR RELATÓRIOS ---

  // Mutation para relatório de evento
  const { mutate: generateEventReport, isPending: isGeneratingEventReport } =
    useMutation({
      mutationFn: (eventId) => api.get(`/reports/frequency/${eventId}`),
      onSuccess: (response) => {
        setEventReportData(response.data);
        toast.success("Relatório por evento gerado com sucesso!");
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || "Falha ao gerar relatório.");
        setEventReportData(null);
      },
    });

  // Mutation para relatório de escola
  const {
    mutate: generateWorkplaceReport,
    isPending: isGeneratingWorkplaceReport,
  } = useMutation({
    mutationFn: ({ workplaceId, startDate, endDate }) => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      return api.get(`/reports/workplace/${workplaceId}?${params.toString()}`);
    },
    onSuccess: (response) => {
      setWorkplaceReportData(response.data);
      toast.success("Relatório por escola gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Falha ao gerar relatório.");
      setWorkplaceReportData(null);
    },
  });

  // NOVA MUTATION: para o relatório filtrado
  const {
    mutate: generateFilteredReport,
    isPending: isGeneratingFilteredReport,
  } = useMutation({
    mutationFn: (activeFilters) => {
      const params = new URLSearchParams(activeFilters);
      return api.get(`/reports/frequency/by-filter?${params.toString()}`);
    },
    onSuccess: (response) => {
      setFilteredReportData(response.data);
      toast.success("Relatório personalizado gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Falha ao gerar relatório.");
      setFilteredReportData(null);
    },
  });

  // NOVA MUTATION: para o relatório de premiações
  const { mutate: generateAwardsReport, isPending: isGeneratingAwardsReport } =
    useMutation({
      mutationFn: () => api.get("/reports/awards"),
      onSuccess: (response) => {
        setAwardsReportData(response.data);
        toast.success("Relatório de premiações gerado com sucesso!");
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || "Falha ao gerar relatório.");
        setAwardsReportData(null);
      },
    });

  // NOVA MUTATION: para o resumo do evento
  const { mutate: generateEventSummary, isPending: isGeneratingEventSummary } =
    useMutation({
      mutationFn: (eventId) => api.get(`/reports/event-summary/${eventId}`),
      onSuccess: (response) => {
        setEventSummaryData(response.data);
        toast.success("Resumo do evento gerado com sucesso!");
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || "Falha ao gerar resumo.");
        setEventSummaryData(null);
      },
    });

  const handleGenerateReport = () => {
    if (!selectedEventId) {
      toast.warning("Por favor, selecione um evento.");
      return;
    }
    // CORREÇÃO 2: Usando o nome correto da mutation
    generateEventReport(selectedEventId);
  };

  const handleGenerateWorkplaceReport = () => {
    if (!selectedWorkplaceId) {
      toast.warning("Por favor, selecione uma escola.");
      return;
    }
    const params = { workplaceId: selectedWorkplaceId };
    if (dateRange?.from) {
      params.startDate = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange?.to) {
      params.endDate = format(dateRange.to, "yyyy-MM-dd");
    }
    generateWorkplaceReport(params);
  };

  // NOVA FUNÇÃO: para gerar o resumo do evento
  const handleGenerateEventSummary = () => {
    if (!selectedEventIdForSummary) {
      toast.warning("Por favor, selecione um evento para o resumo.");
      return;
    }
    generateEventSummary(selectedEventIdForSummary);
  };

  // NOVO: Função para gerar e baixar o PDF do relatório de evento
  const handleDownloadEventPdf = () => {
    if (!eventReportData) {
      toast.error("Gere um relatório primeiro para poder baixá-lo.");
      return;
    }

    const doc = new jsPDF();
    const { event, summary, frequencyData } = eventReportData;

    // Título do Documento
    doc.setFontSize(18);
    doc.text(`Relatório de Frequência: ${event.title}`, 14, 22);

    // Subtítulo e Informações do Sumário
    doc.setFontSize(11);
    doc.setTextColor(100);
    const startDate = format(new Date(event.startDate), "dd/MM/yyyy");
    doc.text(`Data do Evento: ${startDate}`, 14, 30);

    const summaryText = `Inscritos: ${summary.totalEnrollments} | Presentes: ${summary.usersWithCheckin} | Ausentes: ${summary.usersWithoutCheckin} | Participação: ${summary.attendanceRate}%`;
    doc.text(summaryText, 14, 36);

    // MUDANÇA 1: As colunas do PDF agora correspondem à nova tabela.
    const tableColumn = [
      "Participante",
      "Unidade de Trabalho",
      "Status",
      "Horário do Check-in",
    ];
    const tableRows = [];

    // MUDANÇA 2: Os dados de cada linha são mapeados para as novas colunas.
    frequencyData.forEach((item) => {
      // Formata o horário do check-in ou define como '—' se ausente.
      const checkinTimeFormatted = item.checkinTime
        ? format(new Date(item.checkinTime), "HH:mm:ss")
        : "—";

      const rowData = [
        item.user.name,
        item.workplace, // Adicionado
        item.hasCheckedIn ? "Presente" : "Ausente",
        checkinTimeFormatted, // Adicionado
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 42,
    });

    // Salvando o arquivo
    const fileName = `Relatorio_${event.title.replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  };

  // NOVA FUNÇÃO: Para gerar e baixar o PDF do relatório de escola
  const handleDownloadWorkplacePdf = () => {
    if (!workplaceReportData) {
      toast.error("Gere um relatório de escola primeiro para poder baixá-lo.");
      return;
    }

    const doc = new jsPDF();
    const { workplace, summary, userFrequency, period } = workplaceReportData;

    // Título
    doc.setFontSize(18);
    doc.text(`Relatório de Frequência: ${workplace.name}`, 14, 22);

    // Subtítulo e Sumário
    doc.setFontSize(11);
    doc.setTextColor(100);
    const startDateText =
      period.startDate && period.startDate !== "Início"
        ? format(new Date(period.startDate), "dd/MM/yyyy")
        : "Início";
    const endDateText =
      period.endDate && period.endDate !== "Fim"
        ? format(new Date(period.endDate), "dd/MM/yyyy")
        : "Fim";
    doc.text(`Período: ${startDateText} a ${endDateText}`, 14, 30);
    const summaryText = `Usuários: ${summary.totalUsers} | Total de Check-ins: ${summary.totalCheckins} | Participação da Unidade: ${summary.attendanceRate}%`;
    doc.text(summaryText, 14, 36);

    // Tabela
    const tableColumn = [
      "Usuário",
      "Total de Check-ins",
      "Eventos Participados",
    ];
    const tableRows = [];

    userFrequency.forEach((item) => {
      // Formata a lista de eventos para caber na célula do PDF, usando quebra de linha
      const eventsString = Object.values(item.events)
        .map((event) => `${event.title} (${event.checkinCount}x)`)
        .join("\n");

      const rowData = [item.name, item.totalCheckins.toString(), eventsString];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 42,
    });

    const fileName = `Relatorio_${workplace.name.replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  };

  // NOVA FUNÇÃO: para lidar com a mudança nos filtros
  const handleFilterChange = (key, value) => {
    const finalValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: finalValue }));
  };

  // NOVA FUNÇÃO: para gerar o relatório filtrado
  const handleGenerateFilteredReport = () => {
    // Remove chaves de filtro vazias para não poluir a URL
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value)
    );
    // Agora, mesmo que activeFilters esteja vazio, a chamada será feita
    generateFilteredReport(activeFilters);
  };

  // NOVA FUNÇÃO: Para baixar o PDF do relatório filtrado
  const handleDownloadFilteredPdf = () => {
    if (!filteredReportData) {
      toast.error("Gere um relatório personalizado primeiro.");
      return;
    }

    const doc = new jsPDF();
    const { summary, userFrequency, filters } = filteredReportData;

    const filterText = Object.entries(filters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");

    doc.setFontSize(18);
    doc.text("Relatório de Frequência Personalizado", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Filtros Aplicados: ${filterText}`, 14, 30);

    const summaryText = `Usuários Encontrados: ${summary.totalUsersFound} | Com Check-in: ${summary.usersWithCheckin} | Sem Check-in: ${summary.usersWithoutCheckin} | Participação: ${summary.attendanceRate}%`;
    doc.text(summaryText, 14, 36);

    const tableColumn = [
      "Usuário",
      "Total de Check-ins",
      "Eventos Participados",
    ];
    const tableRows = userFrequency.map((item) => {
      const eventsString = Object.values(item.events)
        .map((event) => `${event.title} (${event.checkinCount}x)`)
        .join("\n");
      return [item.name, item.totalCheckins.toString(), eventsString];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 42,
    });

    doc.save("Relatorio_Personalizado.pdf");
  };

  // NOVA FUNÇÃO: para baixar o PDF do relatório de premiações
  const handleDownloadAwardsPdf = () => {
    if (!awardsReportData) {
      toast.error("Gere o relatório de premiações primeiro.");
      return;
    }

    const doc = new jsPDF();
    const { summary, awardsReport } = awardsReportData;

    doc.setFontSize(18);
    doc.text("Relatório de Premiações", 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    const summaryText = `Total de Prêmios Disponíveis: ${summary.totalAwardsAvailable} | Total de Concessões: ${summary.totalAwardsGiven} | Total de Usuários Premiados: ${summary.totalUniqueRecipients}`;
    doc.text(summaryText, 14, 30);

    let startY = 40;

    awardsReport.forEach((award) => {
      if (startY > 260) {
        // Adiciona nova página se o conteúdo estiver muito baixo
        doc.addPage();
        startY = 20;
      }
      doc.setFontSize(14);
      doc.text(
        `${award.name} (${award.recipients.length} premiados)`,
        14,
        startY
      );
      startY += 6;

      const tableColumn = ["Usuário", "Email", "Data da Premiação"];
      const tableRows = award.recipients.map((recipient) => [
        recipient.user.name,
        recipient.user.email,
        format(new Date(recipient.awardedAt), "dd/MM/yyyy HH:mm"),
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY,
      });

      startY = doc.lastAutoTable.finalY + 10; // Pega a posição final da tabela para o próximo item
    });

    doc.save("Relatorio_Premiacoes.pdf");
  };

  // NOVA FUNÇÃO: para baixar o PDF do resumo do evento
  const handleDownloadSummaryPdf = () => {
    if (!eventSummaryData) {
      toast.error("Gere um resumo primeiro para poder baixá-lo.");
      return;
    }

    const doc = new jsPDF();
    const { event, participationSummary, evaluationSummary } = eventSummaryData;

    doc.setFontSize(18);
    doc.text(`Resumo do Evento: ${event.title}`, 14, 22);

    // Seção de Participação
    doc.setFontSize(12);
    doc.text("Resumo da Participação", 14, 40);
    autoTable(doc, {
      startY: 42,
      body: [
        ["Total de Inscritos", participationSummary.totalEnrollments],
        ["Participantes (com Check-in)", participationSummary.usersWithCheckin],
        ["Ausentes (sem Check-in)", participationSummary.usersWithoutCheckin],
        ["Taxa de Participação", `${participationSummary.attendanceRate}%`],
      ],
    });

    let startY = doc.lastAutoTable.finalY + 10;

    // Seção de Avaliações
    doc.text("Resumo das Avaliações", 14, startY);
    autoTable(doc, {
      startY: startY + 2,
      body: [
        ["Total de Avaliações", evaluationSummary.totalEvaluations],
        ["Nota Média", `${evaluationSummary.averageRating} / 5.00`],
      ],
    });

    startY = doc.lastAutoTable.finalY + 10;

    // Seção de Comentários
    if (evaluationSummary.comments.length > 0) {
      doc.text("Comentários", 14, startY);
      doc.setFontSize(10);
      doc.setTextColor(100);
      // Usamos splitTextToSize para quebrar linhas longas
      const splitComments = evaluationSummary.comments
        .map((c) => `- ${c}`)
        .join("\n\n");
      const lines = doc.splitTextToSize(splitComments, 180);
      doc.text(lines, 14, startY + 6);
    }

    doc.save(`Resumo_${event.title.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* NOVO CARD: Resumo do Evento */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Evento</CardTitle>
          <CardDescription>
            Selecione um evento para ver um resumo de participação e avaliações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {" "}
            <Combobox
              options={
                events?.map((event) => ({
                  value: event.id,
                  label: event.title,
                })) || []
              }
              value={selectedEventIdForSummary}
              onSelect={setSelectedEventIdForSummary}
              placeholder={
                isLoadingEvents ? "Carregando..." : "Selecione um evento"
              }
              searchPlaceholder="Pesquisar evento..."
              className="md:w-[350px]"
            />
            <Button
              onClick={handleGenerateEventSummary}
              disabled={isGeneratingEventSummary || !selectedEventIdForSummary}
            >
              {isGeneratingEventSummary && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gerar Resumo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* NOVO CARD: Resultados do Resumo do Evento */}
      {eventSummaryData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Resumo: {eventSummaryData.event.title}</CardTitle>
                <CardDescription>
                  Gerado em:{" "}
                  {format(
                    new Date(eventSummaryData.generatedAt),
                    "dd/MM/yyyy HH:mm"
                  )}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleDownloadSummaryPdf}>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Participação</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <Card>
                  <CardHeader>
                    <CardDescription>Total de Inscritos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold flex items-center justify-center gap-2">
                      <Users />{" "}
                      {eventSummaryData.participationSummary.totalEnrollments}
                    </p>
                    <Button
                      variant="link"
                      className="text-xs h-auto p-0 mt-2 text-blue-600"
                      onClick={() => {
                        setSelectedEventId(eventSummaryData.event.id);
                        generateEventReport(eventSummaryData.event.id);
                        // Scroll suave até a área do relatório
                        setTimeout(() => {
                          const element = document.getElementById('frequency-report-section');
                          if (element) element.scrollIntoView({ behavior: 'smooth' });
                        }, 500);
                      }}
                    >
                      Ver lista completa
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Presentes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold flex items-center justify-center gap-2">
                      <UserCheck />{" "}
                      {eventSummaryData.participationSummary.usersWithCheckin}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Ausentes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold flex items-center justify-center gap-2">
                      <UserX />{" "}
                      {
                        eventSummaryData.participationSummary
                          .usersWithoutCheckin
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardDescription>Taxa de Participação</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      <Badge className="text-xl">
                        {eventSummaryData.participationSummary.attendanceRate}%
                      </Badge>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-2">Avaliações</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="text-center">
                  <CardHeader>
                    <CardDescription>Total de Avaliações</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold flex items-center justify-center gap-2">
                      <MessageSquare />{" "}
                      {eventSummaryData.evaluationSummary.totalEvaluations}
                    </p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardHeader>
                    <CardDescription>Nota Média</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold flex items-center justify-center gap-2">
                      <Star />{" "}
                      {eventSummaryData.evaluationSummary.averageRating} / 5
                    </p>
                  </CardContent>
                </Card>
              </div>
              {eventSummaryData.evaluationSummary.comments.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Comentários:</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto border p-3 rounded-md">
                    {eventSummaryData.evaluationSummary.comments.map(
                      (comment, index) => (
                        <p
                          key={index}
                          className="text-sm text-muted-foreground border-b pb-2"
                        >
                          "{comment}"
                        </p>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card id="frequency-report-section">
        <CardHeader>
          <CardTitle>Relatório de Frequência por Evento</CardTitle>
          <CardDescription>
            Selecione um evento para visualizar a lista de presença, ausência e
            a taxa de participação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Combobox
              options={
                events?.map((event) => ({
                  value: event.id,
                  label: event.title,
                })) || []
              }
              value={selectedEventId}
              onSelect={setSelectedEventId}
              placeholder={
                isLoadingEvents
                  ? "Carregando eventos..."
                  : "Selecione um evento"
              }
              searchPlaceholder="Pesquisar evento..."
              className="md:w-[350px]"
            />
            <Button
              onClick={handleGenerateReport}
              disabled={isGeneratingEventReport || !selectedEventId}
            >
              {isGeneratingEventReport && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CORREÇÃO 3: Usando a variável correta 'eventReportData' */}
      {eventReportData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  Resultados para: {eventReportData.event.title}
                </CardTitle>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-4 pt-2">
                  <span>
                    Total de Inscritos:{" "}
                    <strong>{eventReportData.summary.totalEnrollments}</strong>
                  </span>
                  <span>
                    Presentes:{" "}
                    <strong>{eventReportData.summary.usersWithCheckin}</strong>
                  </span>
                  <span>
                    Ausentes:{" "}
                    <strong>
                      {eventReportData.summary.usersWithoutCheckin}
                    </strong>
                  </span>
                  <span>
                    Taxa de Participação:{" "}
                    <Badge>{eventReportData.summary.attendanceRate}%</Badge>
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={handleDownloadEventPdf}>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[800px] table-fixed">
                <TableHeader>
                  <TableRow>
                    {/* MUDANÇA 1: Cabeçalhos da tabela atualizados */}
                    <TableHead className="w-[25%]">Participante</TableHead>
                    <TableHead className="w-[25%]">
                      Unidade de Trabalho
                    </TableHead>
                    <TableHead className="w-[25%]">Status</TableHead>
                    <TableHead className="w-[25%]">
                      Horário do Check-in
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventReportData.frequencyData.map((item) => (
                    <TableRow key={item.user.id}>
                      {/* MUDANÇA 2: Células da tabela refletindo os novos dados */}
                      <TableCell className="font-medium break-words whitespace-normal">
                        {item.user.name}
                      </TableCell>
                      <TableCell className="whitespace-normal break-words">
                        {item.workplace}
                      </TableCell>
                      <TableCell>
                        {item.hasCheckedIn ? (
                          <Badge variant="default" className="bg-green-600">
                            Presente
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Ausente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {
                          item.checkinTime
                            ? // Formata a data para exibir apenas a hora
                            format(new Date(item.checkinTime), "HH:mm:ss")
                            : "—" // Exibe um traço se não houver check-in
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Card para Relatório por Escola (sem alterações) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Frequência por Escola</CardTitle>
          <CardDescription>
            Selecione uma escola e um período para visualizar a frequência dos
            seus usuários.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Combobox
              options={
                workplaces?.map((wp) => ({
                  value: wp.id,
                  label: `${wp.name} - ${wp.city}`,
                })) || []
              }
              value={selectedWorkplaceId}
              onSelect={setSelectedWorkplaceId}
              placeholder={
                isLoadingWorkplaces
                  ? "Carregando escolas..."
                  : "Selecione uma escola"
              }
              searchPlaceholder="Pesquisar escola..."
              className="md:w-[350px]"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[300px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yy")} -{" "}
                        {format(dateRange.to, "dd/MM/yy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yy")
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              onClick={handleGenerateWorkplaceReport}
              disabled={isGeneratingWorkplaceReport || !selectedWorkplaceId}
            >
              {isGeneratingWorkplaceReport && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {workplaceReportData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  Resultados para: {workplaceReportData.workplace?.name}
                </CardTitle>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-4 pt-2">
                  <span>
                    Período:
                    <strong>
                      {workplaceReportData.period?.startDate &&
                        workplaceReportData.period.startDate !== "Início"
                        ? format(
                          new Date(workplaceReportData.period.startDate),
                          "dd/MM/yyyy"
                        )
                        : "Início"}
                    </strong>{" "}
                    a
                    <strong>
                      {" "}
                      {workplaceReportData.period?.endDate &&
                        workplaceReportData.period.endDate !== "Fim"
                        ? format(
                          new Date(workplaceReportData.period.endDate),
                          "dd/MM/yyyy"
                        )
                        : "Fim"}
                    </strong>
                  </span>
                  <span>
                    Total de Usuários na Escola:{" "}
                    <strong>{workplaceReportData.summary?.totalUsers}</strong>
                  </span>
                  <span>
                    Total de Check-ins:{" "}
                    <strong>
                      {workplaceReportData.summary?.totalCheckins}
                    </strong>
                  </span>
                  <span>
                    Participação da Unidade:{" "}
                    <Badge>
                      {workplaceReportData.summary?.attendanceRate}%
                    </Badge>
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={handleDownloadWorkplacePdf}>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {workplaceReportData.userFrequency?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Total de Check-ins</TableHead>
                    <TableHead>Eventos Participados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workplaceReportData.userFrequency.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.totalCheckins}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {Object.values(item.events).map((event, index) => (
                            <span key={index}>
                              {event.title}{" "}
                              <Badge variant="secondary">
                                {event.checkinCount}x
                              </Badge>
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuário com atividade encontrada para os filtros
                selecionados.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* CARD: Relatório Personalizado (Filtrado) - COM ALTERAÇÕES */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório Geral Personalizado</CardTitle>
          <CardDescription>
            Combine diferentes filtros para gerar um relatório de frequência
            específico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtro de Segmento */}
            <div className="space-y-2">
              <Label>Segmento de Ensino</Label>
              <Combobox
                options={[
                  { value: "all", label: "Todos" },
                  ...teachingSegmentOptions,
                ]}
                value={filters.segment || "all"}
                onSelect={(value) => handleFilterChange("segment", value)}
                placeholder="Selecione..."
                searchPlaceholder="Pesquisar segmento..."
              />
            </div>

            {/* Filtro de Vínculo */}
            <div className="space-y-2">
              <Label>Tipo de Vínculo</Label>
              <Combobox
                options={[
                  { value: "all", label: "Todos" },
                  ...contractTypeOptions,
                ]}
                value={filters.contractType || "all"}
                onSelect={(value) => handleFilterChange("contractType", value)}
                placeholder="Selecione..."
                searchPlaceholder="Pesquisar vínculo..."
              />
            </div>

            {/* Filtro de Profissão */}
            <div className="space-y-2">
              <Label>Profissão</Label>
              <Combobox
                options={[
                  { value: "all", label: "Todas" },
                  ...(professions?.map((p) => ({
                    value: p.id,
                    label: p.name,
                  })) || []),
                ]}
                value={filters.professionId || "all"}
                onSelect={(value) => handleFilterChange("professionId", value)}
                placeholder={
                  isLoadingProfessions ? "Carregando..." : "Selecione..."
                }
                searchPlaceholder="Pesquisar profissão..."
              />
            </div>

            {/* Filtros de Localização */}
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Combobox
                options={[
                  { value: "all", label: "Todos" },
                  ...(filterOptions?.neighborhoods.map((n) => ({
                    value: n,
                    label: n,
                  })) || []),
                ]}
                value={filters.neighborhood || "all"}
                onSelect={(value) => handleFilterChange("neighborhood", value)}
                placeholder={
                  isLoadingFilters ? "Carregando..." : "Selecione..."
                }
                searchPlaceholder="Pesquisar bairro..."
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Button
              onClick={handleGenerateFilteredReport}
              disabled={isGeneratingFilteredReport}
            >
              {isGeneratingFilteredReport && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gerar Relatório Personalizado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* NOVO CARD: Resultados do Relatório Filtrado */}
      {filteredReportData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  Resultados do Relatório Geral Personalizado
                </CardTitle>
                {/* SUMÁRIO ATUALIZADO */}
                <div className="text-sm text-muted-foreground flex flex-wrap gap-4 pt-2">
                  <span>
                    Usuários no Filtro:{" "}
                    <strong>
                      {filteredReportData.summary?.totalUsersFound}
                    </strong>
                  </span>
                  <span>
                    Com Check-in:{" "}
                    <strong>
                      {filteredReportData.summary?.usersWithCheckin}
                    </strong>
                  </span>
                  <span>
                    Sem Check-in:{" "}
                    <strong>
                      {filteredReportData.summary?.usersWithoutCheckin}
                    </strong>
                  </span>
                  <span>
                    Participação:{" "}
                    <Badge>{filteredReportData.summary?.attendanceRate}%</Badge>
                  </span>
                  <span>
                    Total de Check-ins:{" "}
                    <strong>{filteredReportData.summary?.totalCheckins}</strong>
                  </span>
                </div>
              </div>
              {/* NOVO BOTÃO DE DOWNLOAD */}
              <Button variant="outline" onClick={handleDownloadFilteredPdf}>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredReportData.userFrequency?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Total de Check-ins</TableHead>
                    <TableHead>Eventos Participados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReportData.userFrequency.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.totalCheckins}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {Object.values(item.events).map((event, index) => (
                            <span key={index}>
                              {event.title}{" "}
                              <Badge variant="secondary">
                                {event.checkinCount}x
                              </Badge>
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade encontrada para os filtros selecionados.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* NOVO CARD: Relatório de Premiações */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Premiações</CardTitle>
          <CardDescription>
            Visualize todos os prêmios concedidos e seus respectivos ganhadores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Button
              onClick={() => generateAwardsReport()}
              disabled={isGeneratingAwardsReport}
            >
              {isGeneratingAwardsReport && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gerar Relatório de Premiações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* NOVO CARD: Resultados do Relatório de Premiações */}
      {awardsReportData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Resultados do Relatório de Premiações</CardTitle>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-4 pt-2">
                  <span>
                    Prêmios Disponíveis:{" "}
                    <strong>
                      {awardsReportData.summary?.totalAwardsAvailable}
                    </strong>
                  </span>
                  <span>
                    Total de Concessões:{" "}
                    <strong>
                      {awardsReportData.summary?.totalAwardsGiven}
                    </strong>
                  </span>
                  <span>
                    Usuários Premiados (únicos):{" "}
                    <strong>
                      {awardsReportData.summary?.totalUniqueRecipients}
                    </strong>
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={handleDownloadAwardsPdf}>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {awardsReportData.awardsReport?.map((award) => (
                <AccordionItem value={award.id} key={award.id}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{award.name}</span>
                      <Badge>{award.recipients.length} Ganhador(es)</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Data da Premiação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {award.recipients.map((recipient) => (
                          <TableRow key={recipient.user.id}>
                            <TableCell>{recipient.user.name}</TableCell>
                            <TableCell>{recipient.user.email}</TableCell>
                            <TableCell>
                              {format(
                                new Date(recipient.awardedAt),
                                "dd/MM/yyyy HH:mm"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsDashboard;
