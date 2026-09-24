const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { body } = require("express-validator");

// Validações
const categoryValidation = [
    body("name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("O nome da categoria deve ter entre 2 e 100 caracteres"),
    body("color")
        .optional()
        .trim()
        .matches(/^#([0-9A-Fa-f]{3}){1,2}$/)
        .withMessage("A cor deve ser um código HEX válido (ex: #FF0000)"),
];

// Rotas públicas ou privadas dependendo do caso, assumindo que listar é público
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// Rotas restritas a administradores (ou gestores, dependendo da sua regra de negócio)
router.use(authenticateToken);
router.use(requireAdmin); // Apenas ADMIN pode gerenciar categorias globalmente

router.post("/", categoryValidation, categoryController.createCategory);
router.put("/:id", categoryValidation, categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;
