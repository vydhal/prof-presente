import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import UserRanking from "../components/UserRanking"; // Verifique se o caminho está correto
import PunctualityRanking from "../components/PontualityRanking"; // Verifique se o caminho está correto

const Rankings = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho principal da página */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Classificações Gerais</h1>
        <p className="text-gray-600">
          Explore os rankings de usuários mais ativos e mais pontuais da
          plataforma.
        </p>
      </div>

      <Tabs defaultValue="general">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto space-x-2 lg:grid lg:w-full lg:grid-cols-2">
            <TabsTrigger value="general">
              Ranking Geral (Mais Ativos)
            </TabsTrigger>
            <TabsTrigger value="punctuality">
              Ranking de Pontualidade
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="general" className="mt-4">
          <UserRanking />
        </TabsContent>
        <TabsContent value="punctuality" className="mt-4">
          <PunctualityRanking />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Rankings;
