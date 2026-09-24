const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  createWorkplace,
  getWorkplaces,
  getWorkplaceById,
  updateWorkplace,
  deleteWorkplace,
  importWorkplacesFromCSV,
} = require('../controllers/workplaceController');

const {
  authenticateToken,
  requireAdmin,
} = require('../middleware/auth');

// Configurar multer para upload de arquivos CSV
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV são permitidos'));
    }
  }
});

// Listar localidades (público - necessário para formulário de registro)
router.get('/', getWorkplaces);

// Obter localidade por ID (público - necessário para exibir informações)
router.get('/:id', getWorkplaceById);

// Criar localidade (apenas admin)
router.post('/', authenticateToken, requireAdmin, createWorkplace);

// Atualizar localidade (apenas admin)
router.put('/:id', authenticateToken, requireAdmin, updateWorkplace);

// Deletar localidade (apenas admin)
router.delete('/:id', authenticateToken, requireAdmin, deleteWorkplace);

// Importar localidades via CSV (apenas admin)
router.post('/import/csv', authenticateToken, requireAdmin, upload.single('file'), importWorkplacesFromCSV);

module.exports = router;
