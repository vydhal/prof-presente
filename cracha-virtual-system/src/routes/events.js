const express = require("express");
const router = express.Router();

const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  eventValidation,
  uploadEventBadgeTemplate,
  generatePrintableBadges,
  uploadCertificateTemplate,
  uploadPresentationFile,
  deletePresentationFile,
  sendEventCertificates,
  getCertificateLogsForEvent,
  uploadEventThumbnailController,
  uploadSpeakerPhotoController,
  getEventEnrollments,
  getEventQuestions,
} = require("../controllers/eventController");

const {
  addStaffToEvent,
  removeStaffFromEvent,
  getEventStaff,
} = require("../controllers/eventStaffController");

const {
  authenticateToken,
  authenticateOptional,
  requireAdmin
} = require("../middleware/auth");

const {
  uploadBadgeTemplate,
  uploadCertificate,
  uploadEventThumbnail,
  uploadSpeakerPhoto,
  uploadPresentation,
} = require("../middleware/upload");

const { cacheMiddleware } = require("../services/cacheService");

// --- ROTAS DE APRESENTAÇÃO (PDF/PPT) ---
router.post(
  "/:id/presentation",
  authenticateToken,
  uploadPresentation,
  uploadPresentationFile
);

router.delete(
  "/:id/presentation",
  authenticateToken,
  deletePresentationFile
);

// --- ROTAS DE STAFF (EQUIPE) ---
router.post(
  "/:eventId/staff",
  authenticateToken,
  requireAdmin,
  addStaffToEvent
);

router.delete(
  "/:eventId/staff/:userId",
  authenticateToken,
  requireAdmin,
  removeStaffFromEvent
);

router.get(
  "/:eventId/staff",
  authenticateToken,
  requireAdmin,
  getEventStaff
);

// Listar todos os eventos (público - authentication optional)
router.get("/", authenticateOptional, cacheMiddleware(60), getAllEvents);

// Obter evento por ID (público)
router.get("/:id", cacheMiddleware(60), getEventById);

// Rota para gerar o PDF com os crachás para impressão em lote
router.get(
  "/:id/print-badges",
  authenticateToken,
  requireAdmin,
  generatePrintableBadges
);

// Criar evento
router.post("/", authenticateToken, eventValidation, createEvent);

// Rota para criar/atualizar o modelo de crachá de um evento
router.post(
  "/:id/badge-template",
  authenticateToken,
  requireAdmin,
  uploadBadgeTemplate, // Middleware para o upload da imagem
  uploadEventBadgeTemplate
);

// Atualizar evento (apenas admin)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  eventValidation,
  updateEvent
);

// Deletar evento (apenas admin)
router.delete("/:id", authenticateToken, requireAdmin, deleteEvent);

router.post(
  "/:id/thumbnail",
  authenticateToken,
  requireAdmin,
  uploadEventThumbnail, // Middleware de upload
  uploadEventThumbnailController // Controller
);

router.post(
  "/:id/speaker-photo",
  authenticateToken,
  requireAdmin,
  uploadSpeakerPhoto,
  uploadSpeakerPhotoController
);

//Criar certificados para o evento
router.post(
  "/:id/certificate-template",
  authenticateToken,
  requireAdmin,
  uploadCertificate,
  uploadCertificateTemplate
);

router.post(
  "/:id/send-certificates",
  authenticateToken, // Middleware de autenticação
  requireAdmin, // Middleware que verifica se é admin
  sendEventCertificates // Nova função no controller
);

router.get(
  "/:id/certificate-logs",
  authenticateToken,
  requireAdmin,
  getCertificateLogsForEvent // Nova função no controller
);

router.get(
  "/:id/enrollments",
  authenticateToken,
  requireAdmin,
  getEventEnrollments
);

router.get(
  "/:id/questions",
  authenticateToken,
  getEventQuestions
);


module.exports = router;
