import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Star, MessageSquare, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

const Evaluations = () => {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["past-enrollments"],
    queryFn: async () => {
      const response = await api.get("/enrollments");
      const now = new Date();
      return response.data.filter(
        (enrollment) =>
          new Date(enrollment.event.endDate) < now &&
          enrollment.status === "confirmed"
      );
    },
  });

  const { data: myEvaluations } = useQuery({
    queryKey: ["my-evaluations"],
    queryFn: async () => {
      const response = await api.get("/evaluations/my");
      return response.data;
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/evaluations", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["my-evaluations"]);
      toast.success("Avaliação enviada com sucesso!");
      setIsDialogOpen(false);
      setRating(0);
      setComment("");
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao enviar avaliação");
    },
  });

  const handleSubmitEvaluation = () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma nota");
      return;
    }

    evaluateMutation.mutate({
      eventId: selectedEvent.event.id,
      rating,
      comment: comment.trim() || null,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const hasEvaluated = (eventId) => {
    return myEvaluations?.some((evaluation) => evaluation.eventId === eventId);
  };

  const StarRating = ({ value, onChange, readonly = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onChange && onChange(star)}
            className={`transition-colors ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
            disabled={readonly}
          >
            <Star
              className={`h-8 w-8 ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Avaliações</h1>
        <p className="text-gray-600">
          Avalie os eventos que você participou e veja suas avaliações anteriores
        </p>
      </div>

      {enrollments?.length === 0 && (
        <Alert>
          <MessageSquare className="h-4 w-4" />
          <AlertDescription>
            Você ainda não participou de nenhum evento para avaliar.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments?.map((enrollment) => {
          const evaluated = hasEvaluated(enrollment.event.id);
          const evaluation = myEvaluations?.find(
            (evalItem) => evalItem.eventId === enrollment.event.id
          );

          return (
            <Card key={enrollment.id}>
              <CardHeader>
                <CardTitle className="text-lg">{enrollment.event.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {enrollment.event.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(enrollment.event.startDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="line-clamp-1">
                      {enrollment.event.location}
                    </span>
                  </div>
                </div>

                {evaluated ? (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sua avaliação:</span>
                      <Badge className="bg-green-100 text-green-800">
                        Avaliado
                      </Badge>
                    </div>
                    <StarRating value={evaluation.rating} readonly />
                    {evaluation.comment && (
                      <p className="text-sm text-gray-600 italic">
                        "{evaluation.comment}"
                      </p>
                    )}
                  </div>
                ) : (
                  <Dialog
                    open={isDialogOpen && selectedEvent?.id === enrollment.id}
                    onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (!open) {
                        setSelectedEvent(null);
                        setRating(0);
                        setComment("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        onClick={() => setSelectedEvent(enrollment)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Avaliar Evento
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Avaliar Evento</DialogTitle>
                        <DialogDescription>
                          {enrollment.event.title}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label>Sua nota</Label>
                          <StarRating value={rating} onChange={setRating} />
                          {rating > 0 && (
                            <p className="text-sm text-gray-600">
                              {rating === 1 && "Muito ruim"}
                              {rating === 2 && "Ruim"}
                              {rating === 3 && "Regular"}
                              {rating === 4 && "Bom"}
                              {rating === 5 && "Excelente"}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="comment">
                            Comentário (opcional)
                          </Label>
                          <Textarea
                            id="comment"
                            placeholder="Conte-nos sobre sua experiência..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsDialogOpen(false);
                              setSelectedEvent(null);
                              setRating(0);
                              setComment("");
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSubmitEvaluation}
                            disabled={evaluateMutation.isPending}
                          >
                            {evaluateMutation.isPending
                              ? "Enviando..."
                              : "Enviar Avaliação"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Evaluations;
