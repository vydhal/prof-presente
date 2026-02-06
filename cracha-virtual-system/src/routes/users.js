const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfilePhoto,
  updateUserValidation,
  updateUserRole,
  resetUserPassword,
  completeOnboarding,
  updateFacialConsent,
  getUserEnrollments,
} = require("../controllers/userController");

const {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
} = require("../middleware/auth");

const {
  uploadProfilePhoto,
  handleUploadError,
} = require("../middleware/upload");

// Listar todos os usuários (apenas admin)
router.get("/", authenticateToken, requireAdmin, getAllUsers);

// Obter usuário por ID
router.get("/:id", authenticateToken, requireOwnershipOrAdmin, getUserById);

// Atualizar usuário
router.put(
  "/:id",
  authenticateToken,
  requireOwnershipOrAdmin,
  updateUserValidation,
  updateUser
);

// Rota para marcar o tour como concluído
router.put("/me/complete-onboarding", authenticateToken, completeOnboarding);

// Deletar usuário (apenas admin)
router.delete("/:id", authenticateToken, requireAdmin, deleteUser);

// Upload de foto do perfil
router.post(
  "/:id/photo",
  authenticateToken,
  requireOwnershipOrAdmin,
  uploadProfilePhoto,
  handleUploadError,
  updateProfilePhoto
);

// Atualizar role do usuário (apenas admin)
router.patch("/:id/role", authenticateToken, requireAdmin, updateUserRole);

// Redefinir senha do usuário (apenas admin)
router.post(
  "/:id/reset-password",
  authenticateToken,
  requireAdmin,
  resetUserPassword
);

router.put("/me/consent-facial", authenticateToken, updateFacialConsent);

router.get(
  "/:id/enrollments",
  authenticateToken,
  requireOwnershipOrAdmin,
  getUserEnrollments
);

module.exports = router;
