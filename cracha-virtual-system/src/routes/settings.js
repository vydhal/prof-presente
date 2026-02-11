const express = require("express");
const router = express.Router();
const { getSettings, updateSettings } = require("../controllers/settingsController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { uploadBranding, handleUploadError } = require("../middleware/upload");

// Public route to get settings
router.get("/", getSettings);

// Admin routes
router.put(
    "/",
    authenticateToken,
    requireAdmin,
    uploadBranding,
    handleUploadError,
    updateSettings
);

module.exports = router;
