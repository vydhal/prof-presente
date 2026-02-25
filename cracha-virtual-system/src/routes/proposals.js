const express = require("express");
const router = express.Router();
const proposalController = require("../controllers/proposalController");

// Rota pública para enviar propostas
router.post("/", proposalController.submitProposal);

module.exports = router;
