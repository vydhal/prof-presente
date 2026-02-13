const express = require("express");
const router = express.Router();
const {
    getAllSpaces,
    createSpace,
    updateSpace,
    deleteSpace,
    createReservation,
    getReservations,
    updateReservationStatus,
    getReservationConfig,
    updateReservationConfig,
    exportReservations,
} = require("../controllers/spaceController");

const {
    authenticateToken,
    requireAdmin,
} = require("../middleware/auth");

// Middleware para verificar se é Admin OU Cerimonial
const requireCerimonialOrAdmin = (req, res, next) => {
    if (req.user.role === "ADMIN" || req.user.role === "CERIMONIAL") {
        return next();
    }
    return res.status(403).json({ error: "Acesso negado. Apenas Admin ou Cerimonial." });
};

// Middleware para verificar se é Organizador, Admin ou Cerimonial
const requireOrganizerOrAbove = (req, res, next) => {
    const allowedRoles = ["ADMIN", "CERIMONIAL", "ORGANIZER"];
    if (allowedRoles.includes(req.user.role)) {
        return next();
    }
    return res.status(403).json({ error: "Acesso negado." });
};

// --- ROTAS DE ESPAÇOS ---
router.get("/", authenticateToken, requireOrganizerOrAbove, getAllSpaces);
router.post("/", authenticateToken, requireCerimonialOrAdmin, createSpace);
router.put("/:id", authenticateToken, requireCerimonialOrAdmin, updateSpace);
router.delete("/:id", authenticateToken, requireCerimonialOrAdmin, deleteSpace);

// --- ROTAS DE RESERVAS ---
router.get("/reservations", authenticateToken, requireOrganizerOrAbove, getReservations);
router.get("/reservations/export", authenticateToken, requireCerimonialOrAdmin, exportReservations);
router.post("/reservations", authenticateToken, requireOrganizerOrAbove, createReservation);
router.put("/reservations/:id/status", authenticateToken, requireCerimonialOrAdmin, updateReservationStatus);

// --- CONFIGURAÇÃO DO FORMULÁRIO ---
router.get("/config", authenticateToken, requireOrganizerOrAbove, getReservationConfig);
router.put("/config", authenticateToken, requireCerimonialOrAdmin, updateReservationConfig);

module.exports = router;
