import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Textarea } from "../components/ui/textarea";
import { Star, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const EvaluateEnrollment = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: enrollment, isLoading } = useQuery({
    queryKey: ["enrollment", enrollmentId],
    queryFn: async () => {
      const response = await api.get(`/enrollments/users/${enrollmentId}`);
      return response.data;
    },
    enabled: !!enrollmentId,
  });

  const evaluationMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/evaluations", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso!");
      queryClient.invalidateQueries(["my-enrollments"]);
      queryClient.invalidateQueries(["enrollment", enrollmentId]);
      navigate("/my-enrollments");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao enviar avaliação");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Por favor, selecione uma avaliação");
      return;
    }

    evaluationMutation.mutate({
      enrollmentId,
      rating,
      comment: comment.trim() || null,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-red-600">Inscrição não encontrada</p>
            <div className="text-center mt-4">
              <Button onClick={() => navigate("/my-enrollments")}>
                Voltar para Minhas Inscrições
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/my-enrollments")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Avaliar Evento</CardTitle>
          <CardDescription>
            {enrollment.event?.title || "Evento"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">
                Como você avalia este evento?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {rating === 1 && "Muito insatisfeito"}
                  {rating === 2 && "Insatisfeito"}
                  {rating === 3 && "Neutro"}
                  {rating === 4 && "Satisfeito"}
                  {rating === 5 && "Muito satisfeito"}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium mb-2"
              >
                Comentário (opcional)
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Compartilhe sua experiência sobre o evento..."
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/1000 caracteres
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={evaluationMutation.isPending || rating === 0}
                className="flex-1"
              >
                {evaluationMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/my-enrollments")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluateEnrollment;
