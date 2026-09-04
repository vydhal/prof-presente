const express = require('express');
const router = express.Router();
const liveStreamController = require('../controllers/liveStreamController');
const { authenticateToken, requireAdminOrOrganizer } = require('../middleware/auth');
const youtubeService = require('../services/youtubeService');

// ==========================================
// YOUTUBE OAUTH ROUTES
// ==========================================

router.get('/youtube/auth', authenticateToken, requireAdminOrOrganizer, (req, res) => {
    try {
        const url = youtubeService.getAuthUrl();
        res.json({ url });
    } catch (error) {
        console.error('Erro ao gerar URL do YouTube:', error);
        res.status(500).json({ error: error.message || 'Falha ao conectar com YouTube.' });
    }
});

router.get('/youtube/callback', async (req, res) => {
    const { code } = req.query;
    try {
        if (!code) throw new Error('Código de autorização não fornecido.');

        await youtubeService.handleCallback(code);

        // Redirect back to frontend admin settings with success
        const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/admin?tab=streaming&youtube=success`);
    } catch (error) {
        console.error('Erro no callback do YouTube:', error);
        const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/admin?tab=streaming&youtube=error`);
    }
});

// ==========================================
// EVENT STREAMS ROUTES
// ==========================================

// Rotas Administrativas (Eventos)
router.post('/events/:eventId', authenticateToken, requireAdminOrOrganizer, liveStreamController.upsertLiveStream);

// Rota do Participante
router.get('/events/:eventId', authenticateToken, liveStreamController.getLiveStream);

// Rotas da Live (Ping e Chat Histórico)
router.post('/:id/ping', authenticateToken, liveStreamController.pingAttendance);
router.get('/:id/chat', authenticateToken, liveStreamController.getChatHistory);

// ==========================================
// CHECK-IN AO VIVO
// ==========================================

// Organizador/Admin liberam e encerram o check-in
router.post('/:id/checkin/open', authenticateToken, requireAdminOrOrganizer, liveStreamController.openCheckin);
router.post('/:id/checkin/close', authenticateToken, requireAdminOrOrganizer, liveStreamController.closeCheckin);

// Participante consulta status e confirma presença
router.get('/:id/checkin/status', authenticateToken, liveStreamController.getCheckinStatus);
router.post('/:id/checkin/confirm', authenticateToken, liveStreamController.confirmLiveCheckin);

module.exports = router;
