const express = require("express");
const router = express.Router();
const {
    getAllTracks,
    getTrackById,
    createTrack,
    updateTrack,
    deleteTrack,
    enrollInTrack,
    getMyTracks
} = require("../controllers/trackController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { uploadTrackThumbnail, handleUploadError } = require("../middleware/upload");

// Rotas Públicas
router.get("/", getAllTracks);
router.get("/:id", getTrackById);

// Rotas Autenticadas (Usuário)
router.get("/my", authenticateToken, getMyTracks);
router.post("/:trackId/enroll", authenticateToken, enrollInTrack);

// Rotas Admin/Organizer
router.post("/", authenticateToken, requireAdminOrOrganizer, uploadTrackThumbnail, handleUploadError, createTrack);
router.put("/:id", authenticateToken, requireAdminOrOrganizer, uploadTrackThumbnail, handleUploadError, updateTrack);
router.delete("/:id", authenticateToken, requireAdminOrOrganizer, deleteTrack);

module.exports = router;
