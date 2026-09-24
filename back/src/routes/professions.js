const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  createProfession,
  getProfessions,
  getProfessionById,
  updateProfession,
  deleteProfession,
  importProfessionsFromCSV,
} = require('../controllers/professionController');

const {
  authenticateToken,
  requireAdmin,
} = require('../middleware/auth');

// Configuração do Multer para upload de CSV
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV são permitidos'), false);
    }
  }
});

// Rotas públicas (usadas no formulário de registro e para listagem geral)
router.get('/', getProfessions);
router.get('/:id', getProfessionById);

// Rotas protegidas (apenas administradores podem gerenciar profissões)
router.post('/', authenticateToken, requireAdmin, createProfession);
router.put('/:id', authenticateToken, requireAdmin, updateProfession);
router.delete('/:id', authenticateToken, requireAdmin, deleteProfession);
router.post('/import/csv', authenticateToken, requireAdmin, upload.single('file'), importProfessionsFromCSV);

module.exports = router;