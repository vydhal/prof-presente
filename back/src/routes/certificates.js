const express = require("express");
const router = express.Router();
const {
  generateCertificate,
  generateTrackCertificate,
  getMyCertificates
} = require("../controllers/certificateController");
const { authenticateToken } = require("../middleware/auth");

// Rota para o usuário baixar seu próprio certificado de evento
router.get(
  "/event/:parentEventId/user/:userId",
  authenticateToken,
  generateCertificate
);

// Rota para o usuário baixar seu próprio certificado de TRILHA
router.get(
  "/track/:trackId/user/:userId",
  authenticateToken,
  generateTrackCertificate
);
// Rota para o usuário listar seus próprios certificados
router.get("/my", authenticateToken, getMyCertificates);

module.exports = router;
