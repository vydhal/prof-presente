const express = require('express');
const router = express.Router();

const {
  performCheckin,
  getEventCheckins,
  getUserCheckins,
  getEventCheckinStats,
  performFacialCheckin,
} = require('../controllers/checkinController');

const {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  requireCheckinPermission
} = require('../middleware/auth');

// Realizar check-in (apenas ADMIN ou CHECKIN_COORDINATOR)
router.post('/', authenticateToken, requireCheckinPermission, performCheckin);

// Listar check-ins de um evento (apenas admin ou staff de checkin)
router.get('/events/:eventId', authenticateToken, requireCheckinPermission, getEventCheckins);

// Listar check-ins de um usuário
router.get('/users/:userId', authenticateToken, requireOwnershipOrAdmin, getUserCheckins);

// Listar check-ins do usuário logado
router.get('/my', authenticateToken, (req, res, next) => {
  req.params.userId = req.user.id;
  return getUserCheckins(req, res, next);
});

// Obter estatísticas de check-in de um evento (apenas admin ou staff de checkin)
router.get('/events/:eventId/stats', authenticateToken, requireCheckinPermission, getEventCheckinStats);

//a rota para o check-in facial
router.post('/facial', authenticateToken, requireCheckinPermission, performFacialCheckin);

module.exports = router;

