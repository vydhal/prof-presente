const express = require("express");
const router = express.Router();

// Importar todas as rotas
const authRoutes = require("./auth");
const userRoutes = require("./users");
const eventRoutes = require("./events");
const enrollmentRoutes = require("./enrollments");
const badgeRoutes = require("./badges");
const checkinRoutes = require("./checkins");
const awardRoutes = require("./awards");
const evaluationRoutes = require("./evaluations");
const reportRoutes = require("./reports");
const workplaceRoutes = require("./workplaces");
const rankingRoutes = require("./ranking");
const professionRoutes = require("./professions");
const certificateRoutes = require("./certificates");
const trackRoutes = require("./tracks");
const bannerRoutes = require("./banners");

// Configurar rotas
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/events", eventRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/badges", badgeRoutes);
router.use("/checkins", checkinRoutes);
router.use("/awards", awardRoutes);
router.use("/evaluations", evaluationRoutes);
router.use("/reports", reportRoutes);
router.use("/workplaces", workplaceRoutes);
router.use("/ranking", rankingRoutes);
router.use("/professions", professionRoutes);
router.use("/certificates", certificateRoutes);
router.use("/tracks", trackRoutes);
router.use("/banners", bannerRoutes);

// Rota de status da API
router.get("/status", (req, res) => {
  res.json({
    message: "API do Sistema de Crachás Virtuais está funcionando!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rota de documentação básica
router.get("/", (req, res) => {
  res.json({
    message: "Bem-vindo à API do Sistema de Crachás Virtuais",
    version: "1.0.0",
    documentation: "/api/docs",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      events: "/api/events",
      enrollments: "/api/enrollments",
      badges: "/api/badges",
      checkins: "/api/checkins",
      awards: "/api/awards",
      evaluations: "/api/evaluations",
      reports: "/api/reports",
      workplaces: "/api/workplaces",
      ranking: "/api/ranking",
      professions: "/api/professions",
    },
  });
});

module.exports = router;
