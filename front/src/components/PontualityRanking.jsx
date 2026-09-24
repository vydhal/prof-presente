import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Trophy, Medal, Award, Clock } from "lucide-react"; // Importamos o ícone de relógio

const PunctualityRanking = () => {
  const { data: rankings, isLoading } = useQuery({
    // MUDANÇA 1: Nova chave para a query
    queryKey: ["punctuality-ranking"],
    queryFn: async () => {
      // MUDANÇA 2: Novo endpoint da API
      const response = await api.get("/ranking/punctuality?limit=20");
      return response.data.rankings;
    },
  });

  // As funções de ícone e badge de posição são reutilizadas
  const getPositionIcon = (position) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPositionBadge = (position) => {
    if (position === 1) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
          1º Lugar
        </Badge>
      );
    } else if (position === 2) {
      return (
        <Badge className="bg-gradient-to-r from-gray-300 to-gray-500 text-white">
          2º Lugar
        </Badge>
      );
    } else if (position === 3) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-amber-700 text-white">
          3º Lugar
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-white">
        {position}º Lugar
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        {/* MUDANÇA 3: Títulos e descrições atualizados para "Pontualidade" */}
        <h1 className="text-4xl font-bold mb-2 ">Ranking de Pontualidade</h1>
        <p className="text-gray-600">
          Usuários que mais realizaram check-ins antes do início dos eventos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-500" />
            Top Usuários Pontuais
          </CardTitle>
          <CardDescription>
            Classificação baseada no número de check-ins realizados antes do
            horário oficial de início de cada evento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando ranking de pontualidade...</p>
            </div>
          ) : rankings?.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Nenhum usuário com check-ins pontuais registrado ainda.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-[15%]">Posição</TableHead>
                  <TableHead className="w-[50%]">Usuário</TableHead>
                  <TableHead className="text-center w-[35%]">
                    Check-ins Pontuais
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings?.map((item) => (
                  <TableRow key={item.user.id}>
                    <TableCell className="w-[15%]">
                      <div className="flex items-center justify-center gap-2">
                        {getPositionIcon(item.position)}
                      {getPositionBadge(item.position)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 w-[50%]">
                        <Avatar>
                          <AvatarImage
                            src={item.user.photoUrl}
                            alt={item.user.name}
                          />
                          <AvatarFallback>
                            {item.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{item.user.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center w-[35%]">
                      <Badge
                        variant="secondary"
                        className="font-bold text-lg px-4 py-1"
                      >
                        {/* MUDANÇA 5: Usando o campo 'punctualCheckins' retornado pela nova API */}
                        {item.punctualCheckins}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PunctualityRanking;
