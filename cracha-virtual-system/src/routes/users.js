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
  requireAdminOrOrganizer,
  requireOwnershipOrAdmin,
  requireOwnershipOrAdminOrOrganizer,
} = require("../middleware/auth");

const {
  uploadProfilePhoto,
  handleUploadError,
} = require("../middleware/upload");

// Listar todos os usuários (admin ou organizador)
router.get("/", authenticateToken, requireAdminOrOrganizer, getAllUsers);

// Obter usuário por ID
router.get("/:id", authenticateToken, requireOwnershipOrAdminOrOrganizer, getUserById);

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

// Redefinir senha do usuário (admin ou organizador)
router.post(
  "/:id/reset-password",
  authenticateToken,
  requireAdminOrOrganizer,
  resetUserPassword
);

router.put("/me/consent-facial", authenticateToken, updateFacialConsent);

router.get(
  "/:id/enrollments",
  authenticateToken,
  requireOwnershipOrAdminOrOrganizer,
  getUserEnrollments
);

module.exports = router;
