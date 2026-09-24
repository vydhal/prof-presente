const express = require('express');
const router = express.Router();

const {
  createEvaluation,
  getEventEvaluations,
  getEventEvaluationStats,
  getUserEvaluations,
  updateEvaluation,
  evaluationValidation,
} = require('../controllers/evaluationController');

const { 
  authenticateToken, 
  requireAdmin,
  requireOwnershipOrAdmin 
} = require('../middleware/auth');

// Criar avaliação (novo formato - POST /evaluations)
router.post('/', authenticateToken, evaluationValidation, createEvaluation);

// Criar avaliação de curso (compatibilidade)
router.post('/enrollments/:enrollmentId', authenticateToken, evaluationValidation, createEvaluation);

// Listar avaliações do usuário logado
router.get('/my', authenticateToken, (req, res, next) => {
  req.params.userId = req.user.id;
  return getUserEvaluations(req, res, next);
});

// Listar avaliações de um evento (apenas admin)
router.get('/events/:eventId', authenticateToken, requireAdmin, getEventEvaluations);

// Obter estatísticas de avaliação de um evento (apenas admin)
router.get('/events/:eventId/stats', authenticateToken, requireAdmin, getEventEvaluationStats);

// Listar avaliações de um usuário
router.get('/users/:userId', authenticateToken, requireOwnershipOrAdmin, getUserEvaluations);

// Atualizar avaliação
router.put('/:evaluationId', authenticateToken, evaluationValidation, updateEvaluation);

module.exports = router;

