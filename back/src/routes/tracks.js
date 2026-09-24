const express = require("express");
const router = express.Router();
const {
    getAllTracks,
    getTrackById,
    createTrack,
    updateTrack,
    deleteTrack,
    enrollInTrack,
    getMyTracks,
    getTrackEnrollments,
    exportTrackEnrollmentsToCSV
} = require("../controllers/trackController");
const { authenticateToken, requireAdmin, requireAdminOrOrganizer } = require("../middleware/auth");
const { uploadTrackThumbnail, handleUploadError } = require("../middleware/upload");

// Rotas Autenticadas (Usuário)
router.get("/my", authenticateToken, getMyTracks);

// Rotas Públicas
router.get("/", getAllTracks);
router.get("/:id", getTrackById);
router.post("/:trackId/enroll", authenticateToken, enrollInTrack);

// Rotas Admin/Organizer
router.post("/", authenticateToken, requireAdminOrOrganizer, uploadTrackThumbnail, handleUploadError, createTrack);
router.put("/:id", authenticateToken, requireAdminOrOrganizer, uploadTrackThumbnail, handleUploadError, updateTrack);
router.delete("/:id", authenticateToken, requireAdminOrOrganizer, deleteTrack);

// GERENCIAMENTO DE INSCRITOS NA TRILHA
router.get("/:id/enrollments", authenticateToken, requireAdminOrOrganizer, getTrackEnrollments);
router.get("/:id/enrollments/export", authenticateToken, requireAdminOrOrganizer, exportTrackEnrollmentsToCSV);

module.exports = router;
