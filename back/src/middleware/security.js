const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate Limiter: Limita requisições repetidas para evitar DDoS/Brute Force
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10000, // AUMENTADO PARA TESTES: Limita cada IP a 10000 requisições
  standardHeaders: true, // Retorna info de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  message: {
    error: "Muitas requisições deste IP, por favor tente novamente após 15 minutos."
  }
});

// Limiter mais estrito para rotas de autenticação (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Reduzido para 15 minutos para testes
  max: 1000, // AUMENTADO PARA TESTES: 1000 tentativas
  message: {
    error: "Muitas tentativas de login, tente novamente mais tarde."
  }
});

const setupSecurity = (app) => {
  // Helmet adiciona headers de segurança HTTP
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
  
  // CORS deve ser configurado antes, mas helmet ajuda com outros headers
  // Ex: X-Content-Type-Options, X-Frame-Options, etc.

  // Aplicar limiter global nas rotas da API
  // app.use('/api', apiLimiter); // Comentado para aplicar seletivamente ou global no server.js
};

module.exports = {
  apiLimiter,
  authLimiter,
  setupSecurity
};
