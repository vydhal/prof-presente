// NOVO: Arquivo de rotas dedicado para os rankings da aplicação.
const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/auth");
const {
  getCheckinRanking,
  getPunctualityRanking,
} = require("../controllers/rankingController");

// Rota pública para obter o ranking geral de check-ins.
router.get("/checkins", getCheckinRanking);

// Rota para o ranking de pontualidade
router.get("/punctuality", getPunctualityRanking);

module.exports = router;
