const express = require("express");
const router = express.Router();

const {
  createUserBadge,
  getUserBadge,
  getMyUserBadge,
  validateUserBadge,
  searchUsersByName,
  generateMissingBadges,
  getMissingBadgesCount,
  downloadMyUserBadge,
} = require("../controllers/badgeController");

const {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  requireCheckinPermission, // Importe a permissão de check-in
} = require("../middleware/auth");

// Rota para a busca de usuários por nome para o check-in
// O frontend está chamando GET /api/badges/search
router.get(
  "/search",
  authenticateToken,
  requireCheckinPermission,
  searchUsersByName
);

// Outras rotas que você já deve ter...
router.post("/users/:userId", authenticateToken, requireAdmin, createUserBadge);
router.get(
  "/users/:userId",
  authenticateToken,
  requireOwnershipOrAdmin,
  getUserBadge
);
router.get("/my-badge", authenticateToken, getMyUserBadge);

// O middleware 'authenticateToken' garante que só o usuário logado baixe seu crachá.
router.get(
  "/download",
  authenticateToken,
  downloadMyUserBadge
);

router.post(
  "/validate",
  authenticateToken,
  requireCheckinPermission,
  validateUserBadge
);

// Rota para gerar crachás faltantes em lote (apenas admin)
router.post(
  "/generate-missing",
  authenticateToken,
  requireAdmin,
  generateMissingBadges
);

// Rota para obter a contagem de crachás faltantes (apenas admin)
router.get(
  "/missing-count",
  authenticateToken,
  requireAdmin,
  getMissingBadgesCount
);

module.exports = router;
