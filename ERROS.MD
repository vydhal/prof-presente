index-TMNmx7V7.js:282 Main.jsx: Iniciando renderização
index-TMNmx7V7.js:282 Connecting to Socket.io at: https://eduagenda.simplisoft.com.br
index-TMNmx7V7.js:66 useAuth: Iniciando verificação de autenticação
index-TMNmx7V7.js:66 useAuth: Nenhum token encontrado
index-TMNmx7V7.js:282 Connecting to Socket.io at: https://eduagenda.simplisoft.com.br
chrome-extension://j…ntent_reporter.js:1 Uncaught SyntaxError: Unexpected token 'export'
placeholder-event.jpg:1  Failed to load resource: the server responded with a status of 404 ()
api/auth/login:1  Failed to load resource: the server responded with a status of 500 ()


--- DEBUG STARTUP ---
Tentando conectar ao banco: eduagenda_db:5432
DATABASE_URL detectada (mascarada): postgresql://***:***@eduagenda_db:5432/***
Sincronizando schema (prisma db push)...
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "eduagenda_db", schema "public" at "eduagenda_db:5432"
The database is already in sync with the Prisma schema.
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.12.1
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1
npm notice To update run: npm install -g npm@11.12.1
npm notice
Iniciando servidor...
> cracha-virtual-system@2.5.0 start
> node server.js
[dotenv@17.2.2] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
[dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
[CacheService] Conectando ao Redis em: redis://eduagenda_redis:6379
[v22-FIX-ASSETS] Database Host: eduagenda_db:5432/eduagenda_db?schema=public
[v22-FIX-ASSETS] NODE_ENV: production
Starting Email Worker (Simplified)...
Connecting to RabbitMQ at amqp://guest:guest@eduagenda_rabbitmq:5672 (Attempts left: 5)...
🚀 Servidor rodando em http://0.0.0.0:3000
📚 Documentação da API: http://0.0.0.0:3000/api
🌍 Ambiente: production
[CacheService] Conectado com sucesso!
RabbitMQ Connected Successfully
Listening on queue email_queue
✅ Conectado ao banco de dados PostgreSQL com connection pooling
[SOCKET-DEBUG] Novo socket conectado: AxqjmGm60ZNO7-UvAAAB
2026-04-06T12:55:28.990Z - GET /api/settings
[SOCKET-DEBUG] Novo socket conectado: 0ZhY15eNjVz6tDxEAAAE
[SOCKET-DEBUG] Novo socket conectado: D4Jqg-XQjXzsv5iUAAAF
2026-04-06T12:55:29.292Z - GET /api/banners/active
2026-04-06T12:55:29.295Z - GET /api/events
2026-04-06T12:55:29.297Z - GET /api/tracks
[Cache] MISS - Key: express_cache:anon:/api/events?public=true&upcoming=true&limit=100
2026-04-06T12:55:29.303Z - GET /api/categories
[SOCKET-DEBUG] Novo socket conectado: Y8l5iuSY85oWGebZAAAH
[SOCKET-DEBUG] Novo socket conectado: bQ4j_kMp6X4AhVxNAAAJ
[SOCKET-DEBUG] Novo socket conectado: tcKL0o_9Cj0EnuywAAAL
[SOCKET-DEBUG] Novo socket conectado: iSCJjbc3RixbbKygAAAO
[SOCKET-DEBUG] Novo socket conectado: 7XLSz79AJ8oipGq3AAAP
Erro não tratado: Error: Not allowed by CORS
    at origin (/app/src/app.js:44:18)
    at /app/node_modules/cors/lib/index.js:219:13
    at optionsCallback (/app/node_modules/cors/lib/index.js:199:9)
    at corsMiddleware (/app/node_modules/cors/lib/index.js:204:7)
    at Layer.handleRequest (/app/node_modules/router/lib/layer.js:152:17)
    at trimPrefix (/app/node_modules/router/index.js:342:13)
    at /app/node_modules/router/index.js:297:9
    at processParams (/app/node_modules/router/index.js:582:12)
    at next (/app/node_modules/router/index.js:291:5)
    at /app/node_modules/express-rate-limit/dist/index.cjs:942:7
Erro não tratado: Error: Not allowed by CORS
    at origin (/app/src/app.js:44:18)
    at /app/node_modules/cors/lib/index.js:219:13
    at optionsCallback (/app/node_modules/cors/lib/index.js:199:9)
    at corsMiddleware (/app/node_modules/cors/lib/index.js:204:7)
    at Layer.handleRequest (/app/node_modules/router/lib/layer.js:152:17)
    at trimPrefix (/app/node_modules/router/index.js:342:13)
    at /app/node_modules/router/index.js:297:9
    at processParams (/app/node_modules/router/index.js:582:12)
    at next (/app/node_modules/router/index.js:291:5)
    at /app/node_modules/express-rate-limit/dist/index.cjs:942:7
Socket desconectado: 0ZhY15eNjVz6tDxEAAAE
Socket desconectado: D4Jqg-XQjXzsv5iUAAAF
2026-04-06T12:56:12.075Z - GET /api/settings
[SOCKET-DEBUG] Novo socket conectado: 02jH-S42B-k5eY9ZAAAS
[SOCKET-DEBUG] Novo socket conectado: sJL-RDwE2bwjlrXBAAAT
2026-04-06T12:56:13.972Z - GET /api/banners/active
2026-04-06T12:56:13.973Z - GET /api/tracks
2026-04-06T12:56:13.974Z - GET /api/events
2026-04-06T12:56:13.975Z - GET /api/categories
[Cache] HIT - Key: express_cache:anon:/api/events?public=true&upcoming=true&limit=100
Erro não tratado: Error: Not allowed by CORS
    at origin (/app/src/app.js:44:18)
    at /app/node_modules/cors/lib/index.js:219:13
    at optionsCallback (/app/node_modules/cors/lib/index.js:199:9)
    at corsMiddleware (/app/node_modules/cors/lib/index.js:204:7)
    at Layer.handleRequest (/app/node_modules/router/lib/layer.js:152:17)
    at trimPrefix (/app/node_modules/router/index.js:342:13)
    at /app/node_modules/router/index.js:297:9
    at processParams (/app/node_modules/router/index.js:582:12)
    at next (/app/node_modules/router/index.js:291:5)
    at /app/node_modules/express-rate-limit/dist/index.cjs:942:7
Socket desconectado: 7XLSz79AJ8oipGq3AAAP
Socket desconectado: iSCJjbc3RixbbKygAAAO
2026-04-06T12:56:55.302Z - GET /api/settings
[SOCKET-DEBUG] Novo socket conectado: YmxQEi9iTmN9J9fwAAAW
[SOCKET-DEBUG] Novo socket conectado: IZOu8s-M3tufGtQCAAAX
2026-04-06T12:56:55.620Z - GET /api/events/dda10a8d-e0d0-439a-995b-4d1b10b2e7f6
[Cache] MISS - Key: express_cache:anon:/api/events/dda10a8d-e0d0-439a-995b-4d1b10b2e7f6