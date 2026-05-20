const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  registerValidation,
  loginValidation,
  googleLogin,
} = require("../controllers/authController");

const { authenticateToken } = require("../middleware/auth");
const { uploadProfilePhoto } = require("../middleware/upload");

// Rotas públicas
router.post("/register", uploadProfilePhoto, registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/google", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Rotas protegidas
router.get("/profile", authenticateToken, getProfile);

module.exports = router;
