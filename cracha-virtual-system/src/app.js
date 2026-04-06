const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { connectDatabase } = require("./config/database");
const routes = require("./routes");
const { setupSecurity, apiLimiter } = require('./middleware/security');

const app = express();

// Log para depuração de ambiente (v22-FIX-ASSETS)
const dbUrl = process.env.DATABASE_URL || "";
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
console.log(`[v22-FIX-ASSETS] Database Host: ${dbUrl.split('@')[1] || 'não definido'}`);
console.log(`[v22-FIX-ASSETS] NODE_ENV: ${process.env.NODE_ENV}`);

// Confiar no proxy (Traefik) para o rate-limit e logs de IP
app.set('trust proxy', 1);

// Segurança (Headers + Rate Limit)
setupSecurity(app);
app.use(apiLimiter);

// Conectar ao banco de dados
connectDatabase();

// Middleware básico
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "https://eduagenda.simplisoft.com.br",
        "http://localhost:5173",
        "http://localhost:3001"
      ];

      // Permitir requisições sem origin (como apps mobile ou curl)
      if (!origin) return callback(null, true);

      // Verificação mais flexível para evitar problemas com barras ou subdomínios
      const isAllowed = allowedOrigins.some(authOrigin => origin.startsWith(authOrigin)) || 
                        origin.includes("eduagenda.simplisoft.com.br");

      if (isAllowed || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        console.error(`[CORS-BLOCK] Origem rejeitada: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir arquivos estáticos (uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/uploads", express.static(path.join(__dirname, "../uploads")));

// Middleware de log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas da API
app.use("/api", routes);

// Rota raiz
app.get("/", (req, res) => {
  res.json({
    message: "Sistema de Crachás Virtuais - API",
    version: "1.0.0",
    status: "online",
    documentation: "/api",
  });
});

// Middleware de tratamento de erros 404
app.use((req, res) => {
  console.log(`[404] Endpoint não encontrado: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Endpoint não encontrado",
    message: `A rota ${req.method} ${req.originalUrl} não existe`,
  });
});

// Middleware de tratamento de erros globais
app.use((error, req, res, next) => {
  console.error("Erro não tratado:", error);

  res.status(error.status || 500).json({
    error: "Erro interno do servidor",
    message:
      process.env.NODE_ENV === "production" ? "Algo deu errado" : error.message,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  });
});

module.exports = app;
