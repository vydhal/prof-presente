const express = require("express");
const router = express.Router();

const {
  enrollInEvent,
  getUserEnrollments,
  getMyEnrollments,
  getEventEnrollments,
  cancelEnrollment,
  updateEnrollmentStatus,
  resendConfirmationEmail,
  deleteEnrollment,
  moveEnrollment,
} = require("../controllers/enrollmentController");

const {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
} = require("../middleware/auth");

// Inscrever usuário em evento
router.post("/events/:eventId/enroll", authenticateToken, enrollInEvent);

// Listar inscrições de um usuário
router.get(
  "/users/:userId",
  authenticateToken,
  requireOwnershipOrAdmin,
  getUserEnrollments
);

// Listar inscrições de um evento (apenas admin)
router.get(
  "/events/:eventId",
  authenticateToken,
  requireAdmin,
  getEventEnrollments
);

// Listar inscrições do usuário logado
router.get("/my-enrollments", authenticateToken, getMyEnrollments);

// Criar inscrição (POST /enrollments)
router.post("/", authenticateToken, enrollInEvent);

// Obter status de inscrição do usuário em um evento específico
router.get("/event/:eventId/status", authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const { prisma } = require('../config/database');

    // ALTERAÇÃO: Removido o "include: { badge: true }"
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        eventId: eventId,
        userId: userId,
      },
    });

    if (!enrollment) {
      return res.json({
        enrolled: false,
        enrollmentId: null,
        status: null,
      });
    }

    const enrollmentCount = await prisma.enrollment.count({
      where: {
        eventId: eventId,
        status: 'APPROVED',
      },
    });

    res.json({
      enrolled: true,
      enrollmentId: enrollment.id,
      status: enrollment.status,
      // ALTERAÇÃO: A propriedade "badge" foi removida da resposta.
      enrollmentCount,
    });
  } catch (error) {
    console.error('Erro ao verificar status de inscrição:', error);
    res.status(500).json({ error: 'Erro ao verificar status de inscrição' });
  }
});

// Listar todas as inscrições (com filtros e paginação)
router.get("/", authenticateToken, getMyEnrollments);

// Cancelar inscrição (DELETE) - Mantido para compatibilidade, faz o mesmo que o patch cancel
router.delete("/:enrollmentId", authenticateToken, cancelEnrollment);

// DELETAR INSCRIÇÃO PERMANENTEMENTE (Libera vaga)
router.delete("/:enrollmentId/permanent", authenticateToken, requireAdmin, deleteEnrollment);

// Cancelar inscrição (PATCH - compatibilidade)
router.patch("/:enrollmentId/cancel", authenticateToken, cancelEnrollment);

// MOVER PARTICIPANTE PARA OUTRO EVENTO
router.patch("/:enrollmentId/move", authenticateToken, requireAdmin, moveEnrollment);

// Atualizar status da inscrição (apenas admin)
router.patch(
  "/:enrollmentId/status",
  authenticateToken,
  requireAdmin,
  updateEnrollmentStatus
);

// Reenviar e-mail de confirmação (apenas admin)
router.post(
  "/:enrollmentId/resend-confirmation",
  authenticateToken,
  requireAdmin,
  resendConfirmationEmail
);

module.exports = router;
