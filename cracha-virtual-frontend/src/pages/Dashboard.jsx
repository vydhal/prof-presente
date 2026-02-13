import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Calendar, CreditCard, Award, TrendingUp, Users, ChartBar as BarChart3, Clock, MapPin, Star } from 'lucide-react';
import { eventsAPI, enrollmentsAPI, checkinsAPI, awardsAPI } from '../lib/api';
import '../App.css';

const Dashboard = () => {
  const { user, isAdmin, isOrg, isGestor } = useAuth();
  const [stats, setStats] = useState({
    upcomingEvents: [],
    myEnrollments: [],
    myCheckins: 0,
    myAwards: [],
    loading: true,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Carregar eventos próximos
        const eventsResponse = await eventsAPI.getAll({
          limit: 4,
          upcoming: true
        });

        // Carregar minhas inscrições
        const enrollmentsResponse = await enrollmentsAPI.getUserEnrollments(user.id, {
          limit: 5
        });

        // Carregar contagem de check-ins
        const checkinsResponse = await checkinsAPI.getUserCheckins(user.id, {
          limit: 1
        });

        // Carregar minhas premiações
        const awardsResponse = await awardsAPI.getUserAwards(user.id, {
          limit: 4
        });

        setStats({
          upcomingEvents: eventsResponse.data.events || [],
          myEnrollments: enrollmentsResponse.data.enrollments || [],
          myCheckins: checkinsResponse.data.pagination?.total || 0,
          myAwards: awardsResponse.data.userAwards || [],
          loading: false,
        });
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { label: 'Pendente', variant: 'outline' },
      APPROVED: { label: 'Aprovado', variant: 'default' },
      REJECTED: { label: 'Rejeitado', variant: 'destructive' },
      CANCELLED: { label: 'Cancelado', variant: 'secondary' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (stats.loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Olá, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Bem-vindo ao seu dashboard de crachás virtuais
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button asChild>
            <Link to="/events">
              <Calendar className="mr-2 h-4 w-4" />
              Ver Eventos
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inscrições Ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.myEnrollments.filter(e => e.status === 'APPROVED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.myEnrollments.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Realizados</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myCheckins}</div>
            <p className="text-xs text-muted-foreground">
              Total de presenças
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premiações</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myAwards.length}</div>
            <p className="text-xs text-muted-foreground">
              Badges conquistados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Próximos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis para inscrição
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Próximos Eventos
            </CardTitle>
            <CardDescription>
              Eventos disponíveis para inscrição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingEvents.length > 0 ? (
                stats.upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{event.title}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDate(event.startDate)}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" />
                        {event.location}
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <Link to={`/events/${event.id}`}>
                        Ver Detalhes
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum evento próximo encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Minhas Inscrições */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Minhas Inscrições
            </CardTitle>
            <CardDescription>
              Suas inscrições recentes em eventos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.myEnrollments.length > 0 ? (
                stats.myEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{enrollment.event.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        {getStatusBadge(enrollment.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(enrollment.enrollmentDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhuma inscrição encontrada</p>
                  <Button className="mt-4" asChild>
                    <Link to="/events">
                      Explorar Eventos
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premiações Recentes */}
      {stats.myAwards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5" />
              Suas Premiações
            </CardTitle>
            <CardDescription>
              Badges e conquistas recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.myAwards.map((userAward) => (
                <div key={userAward.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{userAward.award.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(userAward.awardedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links rápidos para admins */}
      {(isAdmin || isOrg || isGestor) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Painel Administrativo
            </CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades administrativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button variant="outline" asChild>
                <Link to="/admin?tab=users">
                  <Users className="mr-2 h-4 w-4" />
                  Gerenciar Usuários
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin?tab=dashboard">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Relatórios
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin?tab=events">
                  <Calendar className="mr-2 h-4 w-4" />
                  Criar Evento
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;

