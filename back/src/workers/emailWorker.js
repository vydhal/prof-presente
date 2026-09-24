const { consumeQueue } = require('../services/queueService');
const certificateService = require('../services/certificateService');

const startEmailWorker = async () => {
    console.log('Starting Email Worker (Simplified)...');
    
    await consumeQueue('email_queue', async (data) => {
        console.log(`[Worker] Received message from queue:`, JSON.stringify(data, null, 2));
        const { type, payload } = data;
        
        if (type === 'SEND_CERTIFICATES') {
             console.log(`[Worker] Delegating SEND_CERTIFICATES to CertificateService for event ${payload.eventId}`);
             await certificateService.processCertificateBatch(payload.eventId, payload.adminEmail);
        } else {
             console.log(`[Worker] Unknown message type received: ${type}`);
        }
    });
};

module.exports = { startEmailWorker };
