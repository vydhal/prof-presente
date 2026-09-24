const { PrismaClient } = require("@prisma/client");

// Configuração otimizada do Prisma com connection pooling
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}).$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        const before = Date.now();

        try {
          const result = await query(args);
          const after = Date.now();

          if (after - before > 1000) {
            console.warn(
              `Slow query detected: ${model}.${operation} took ${after - before
              }ms`
            );
          }

          return result;
        } catch (error) {
          console.error(`Database error in ${model}.${operation}:`, error);
          throw error;
        }
      },
    },
  },
});

// Configurações de connection pooling para PostgreSQL
const connectionPoolConfig = {
  // Número máximo de conexões no pool
  max: parseInt(process.env.DB_POOL_MAX) || 20,

  // Número mínimo de conexões no pool
  min: parseInt(process.env.DB_POOL_MIN) || 2,

  // Tempo limite para obter uma conexão (em ms)
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,

  // Tempo limite para uma conexão inativa (em ms)
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,

  // Tempo de vida máximo de uma conexão (em ms)
  maxLifetime: parseInt(process.env.DB_MAX_LIFETIME) || 1800000, // 30 minutos
};

// Função para conectar ao banco de dados
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log(
      "✅ Conectado ao banco de dados PostgreSQL com connection pooling"
    );
  } catch (error) {
    console.error("❌ [v12-DEBUG] Erro FATAL ao conectar com o banco de dados:");
    console.error("Motivo:", error.message);
    console.log("DICA: Se for P1000, verifique se o volume db_data no Portainer precisa ser deletado para aceitar as novas senhas.");
    process.exit(1);
  }
}

// Função para desconectar do banco de dados
async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log("✅ Desconectado do banco de dados PostgreSQL");
  } catch (error) {
    console.error("❌ Erro ao desconectar do banco de dados:", error);
  }
}

// Função para verificar a saúde da conexão
const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "healthy", timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Função para obter estatísticas do pool de conexões
const getConnectionStats = async () => {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;

    return result[0];
  } catch (error) {
    console.error("Failed to get connection stats:", error);
    return null;
  }
};

// Função para otimizar queries com paginação
const createPaginationQuery = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    skip,
    take: Math.min(limit, 100), // Máximo de 100 itens por página
  };
};

// Função para criar queries com ordenação otimizada
const createOrderByQuery = (sortBy = "createdAt", sortOrder = "desc") => {
  return {
    [sortBy]: sortOrder,
  };
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("Closing database connections...");
  await prisma.$disconnect();
  console.log("Database connections closed.");
};

// Configurar handlers para graceful shutdown
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

module.exports = {
  prisma,
  connectionPoolConfig,
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  getConnectionStats,
  createPaginationQuery,
  createOrderByQuery,
  gracefulShutdown,
};
