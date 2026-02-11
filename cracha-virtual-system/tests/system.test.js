const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/database');

describe('System Health and Public Endpoints', () => {
    it('should return 200 for the root URL', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('online');
    });

    it('should return 200 for the API status URL', async () => {
        const res = await request(app).get('/api/status');
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain('funcionando');
    });

    it('should return 404 for unknown route', async () => {
        const res = await request(app).get('/api/unknown');
        expect(res.statusCode).toBe(404);
    });
});

describe('Auth Endpoints', () => {
    it('should fail login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            });

        // Either 401 or 400 depending on implementation
        expect([400, 401]).toContain(res.statusCode);
    });

    it('should fail registration with invalid data', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: '',
                email: 'invalid-email',
                password: '123'
            });

        expect(res.statusCode).toBe(400);
    });
});
