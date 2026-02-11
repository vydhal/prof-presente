const express = require("express");
const router = express.Router();
const {
    getAllBanners,
    getActiveBanners,
    createBanner,
    updateBanner,
    deleteBanner
} = require("../controllers/bannerController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { uploadBannerThumbnail, handleUploadError } = require("../middleware/upload");

// Rota Pública (apenas ativos)
router.get("/active", getActiveBanners);

// Rotas Admin
router.get("/", authenticateToken, requireAdmin, getAllBanners);
router.post("/", authenticateToken, requireAdmin, uploadBannerThumbnail, handleUploadError, createBanner);
router.put("/:id", authenticateToken, requireAdmin, uploadBannerThumbnail, handleUploadError, updateBanner);
router.delete("/:id", authenticateToken, requireAdmin, deleteBanner);

module.exports = router;
