import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

const UserRanking = () => {
  const { data: rankings, isLoading } = useQuery({
    // ALTERAÇÃO: A chave da query foi atualizada.
    queryKey: ["user-checkin-ranking"],
    queryFn: async () => {
      // ALTERAÇÃO: A URL da API foi atualizada para o novo endpoint de ranking.
      const response = await api.get("/ranking/checkins?limit=20");
      return response.data.rankings;
    },
  });

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
        {/* ALTERAÇÃO: Títulos e descrições atualizados. */}
        <h1 className="text-4xl font-bold mb-2 ">Ranking de Usuários</h1>
        <p className="text-gray-600">
          Usuários mais ativos com maior número de presenças nos eventos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Top Usuários
          </CardTitle>
          <CardDescription>
            Classificação baseada no número total de check-ins realizados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando ranking...</p>
            </div>
          ) : rankings?.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Nenhum usuário com check-ins registrados ainda.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-[15%]">Posição</TableHead>
                  <TableHead className="w-[50%]">Usuário</TableHead>
                  <TableHead className="text-center w-[35%]">
                    Check-ins
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* ALTERAÇÃO: Mapeamento de 'item.teacher' para 'item.user'. */}
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
                        {item.totalCheckins}
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

export default UserRanking;
