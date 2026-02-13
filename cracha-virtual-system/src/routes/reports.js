const express = require("express");
const router = express.Router();

const {
  getCheckinReport,
  getFrequencyReport,
  getFrequencyRanking,
  getSystemReport,
  getWorkplaceReport,
  getFilteredFrequencyReport,
  getAwardsReport,
  getEventSummaryReport,
  getReportFilterOptions,
} = require("../controllers/reportController");

const {
  authenticateToken,
  requireAdmin,
  requireAdminOrOrganizer,
} = require("../middleware/auth");

// --- ROTAS ESPECÍFICAS PRIMEIRO ---

// Rota para buscar as opções de filtro dos relatórios
router.get(
  "/filters/options",
  authenticateToken,
  requireAdminOrOrganizer,
  getReportFilterOptions
);

// Relatório de frequência com filtros (a rota mais específica de "/frequency")
router.get(
  "/frequency/by-filter",
  authenticateToken,
  requireAdminOrOrganizer,
  getFilteredFrequencyReport
);

// --- ROTAS GENÉRICAS / COM PARÂMETROS DEPOIS ---

// Relatório de check-ins de um evento
router.get(
  "/checkins/:eventId",
  authenticateToken,
  requireAdminOrOrganizer,
  getCheckinReport
);

// Relatório de frequência de um evento
router.get(
  "/frequency/:eventId",
  authenticateToken,
  requireAdminOrOrganizer,
  getFrequencyReport
);

// Relatório de frequência por escola
router.get(
  "/workplace/:workplaceId",
  authenticateToken,
  requireAdminOrOrganizer,
  getWorkplaceReport
);

// Relatório de resumo de um evento
router.get(
  "/event-summary/:eventId",
  authenticateToken,
  requireAdminOrOrganizer,
  getEventSummaryReport
);

// --- ROTAS GERAIS ---

// Relatório de premiações
router.get("/awards", authenticateToken, requireAdminOrOrganizer, getAwardsReport);

// Ranking geral de frequência
router.get("/ranking", authenticateToken, requireAdminOrOrganizer, getFrequencyRanking);

// Relatório geral do sistema
router.get("/system", authenticateToken, requireAdminOrOrganizer, getSystemReport);

// Estatísticas gerais do sistema
router.get("/statistics", authenticateToken, requireAdminOrOrganizer, async (req, res) => {
  try {
    const { prisma } = require("../config/database");
    const [totalEvents, totalUsers, activeEnrollments, totalCheckins] =
      await Promise.all([
        prisma.event.count(),
        prisma.user.count(),
        prisma.enrollment.count({ where: { status: "APPROVED" } }),
        prisma.userCheckin.count(),
      ]);
    res.json({ totalEvents, totalUsers, activeEnrollments, totalCheckins });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

module.exports = router;
