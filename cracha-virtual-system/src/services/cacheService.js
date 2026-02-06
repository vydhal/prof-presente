const Redis = require('ioredis');

// Configuração da conexão com o Redis
// Usa a variável de ambiente REDIS_URL ou o padrão do Docker (redis:6379)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

console.log(`[CacheService] Conectando ao Redis em: ${redisUrl}`);

const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    // Tenta reconectar a cada 5 segundos se cair
    return 5000;
  },
  maxRetriesPerRequest: 3
});

redis.on('connect', () => {
  console.log('[CacheService] Conectado com sucesso!');
});

redis.on('error', (err) => {
  console.error('[CacheService] Erro na conexão:', err);
});

module.exports = {
  client: redis,

  /**
   * Obtém um valor do cache
   * @param {string} key - Chave do cache
   * @returns {Promise<any>} - O valor parseado (JSON) ou null
   */
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`[CacheService] Erro ao buscar key ${key}:`, error);
      return null;
    }
  },

  /**
   * Salva um valor no cache
   * @param {string} key - Chave
   * @param {any} value - Valor (será convertido para string)
   * @param {number} ttlSeconds - Tempo de vida em segundos (padrão 60s)
   */
  async set(key, value, ttlSeconds = 60) {
    try {
      const stringValue = JSON.stringify(value);
      await redis.set(key, stringValue, 'EX', ttlSeconds);
    } catch (error) {
      console.error(`[CacheService] Erro ao setar key ${key}:`, error);
    }
  },

  /**
   * Deleta uma chave (ou padrão de chaves se suportado, aqui simplificado)
   * @param {string} key 
   */
  async del(key) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`[CacheService] Erro ao deletar key ${key}:`, error);
    }
  },

  /**
   * Middleware para Express que faz cache da resposta GET
   * @param {number} duration - Duração em segundos
   */
  cacheMiddleware(duration = 60) {
    return async (req, res, next) => {
      // Apenas cacheia GET
      if (req.method !== 'GET') {
        return next();
      }

      // Cria uma chave baseada na URL original (incluindo query params)
      const key = `express_cache:${req.originalUrl || req.url}`;

      try {
        const cachedBody = await redis.get(key);
        if (cachedBody) {
          // Se achou, retorna direto e adiciona header indicando Cache HIT
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('Content-Type', 'application/json'); 
          return res.send(cachedBody);
        } else {
          // Se não achou, intercepta o res.send para salvar no cache depois
          res.setHeader('X-Cache', 'MISS');
          
          // Guarda a referência original do res.send e res.json
          const originalSend = res.send;
          const originalJson = res.json;

          res.send = (body) => {
            // Salva no Redis antes de enviar a resposta
            // Se o status for 200, salva. Se for erro, não cacheia.
            if (res.statusCode === 200) {
              redis.set(key, typeof body === 'string' ? body : JSON.stringify(body), 'EX', duration).catch(err => console.error('[Cachemw] Erro ao salvar:', err));
            }
            originalSend.call(res, body);
          };

          // Alguns controllers usam res.json, interceptamos também
          /* 
             Nota: Express internamente chama res.send dentro de res.json, 
             então muitas vezes só interceptar send é suficiente, mas depende da versão.
          */
          
          next();
        }
      } catch (err) {
        console.error('[CacheMiddleware] Erro:', err);
        next(); // Em caso de erro no Redis, segue sem cache
      }
    };
  }
};
