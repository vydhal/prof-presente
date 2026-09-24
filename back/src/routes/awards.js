const express = require("express");
const router = express.Router();

const {
  getAllAwards,
  createAward,
  getUserAwards,
  grantAwardToUser,
  getAwardsRanking,
  awardValidation,
  updateAward,
  deleteAward,
} = require("../controllers/awardController");

const {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
} = require("../middleware/auth");

const { uploadInsignia } = require("../middleware/upload"); // NOVO: Importa o middleware

// Listar todas as premiações (público)
router.get("/", getAllAwards);

// Criar premiação (apenas admin)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  uploadInsignia,
  awardValidation,
  createAward
);

// Listar premiações de um usuário
router.get(
  "/users/:userId",
  authenticateToken,
  requireOwnershipOrAdmin,
  getUserAwards
);

// Conceder premiação a um usuário (apenas admin)
router.post("/grant", authenticateToken, requireAdmin, grantAwardToUser);

// Ranking de usuários por premiações (público)
router.get("/ranking", getAwardsRanking);

// NOVA ROTA: Atualizar uma premiação
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  uploadInsignia,
  awardValidation,
  updateAward
);

// NOVA ROTA: Deletar uma premiação
router.delete("/:id", authenticateToken, requireAdmin, deleteAward);

module.exports = router;
