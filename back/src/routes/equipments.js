const express = require("express");
const router = express.Router();
const {
    getAllEquipments,
    getEquipmentAvailability,
    createEquipment,
    updateEquipment,
    deleteEquipment
} = require("../controllers/equipmentController");
const { authenticateToken } = require("../middleware/auth");

const requireCerimonialOrAdmin = (req, res, next) => {
    if (req.user.role === "ADMIN" || req.user.role === "CERIMONIAL") {
        return next();
    }
    return res.status(403).json({ error: "Acesso negado. Apenas Admin ou Cerimonial." });
};

router.get("/", authenticateToken, getAllEquipments);
router.get("/availability", authenticateToken, getEquipmentAvailability);
router.post("/", authenticateToken, requireCerimonialOrAdmin, createEquipment);
router.put("/:id", authenticateToken, requireCerimonialOrAdmin, updateEquipment);
router.delete("/:id", authenticateToken, requireCerimonialOrAdmin, deleteEquipment);

module.exports = router;
