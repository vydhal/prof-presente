const jwt = require("jsonwebtoken");
const { prisma } = require("../config/database");

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: "Token de acesso requerido",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Usuário não encontrado",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return res.status(403).json({
      error: "Token inválido",
    });
  }
};

// Middleware para verificar se o usuário é admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(500).json({ error: "Erro interno: Usuário não autenticado." });
  }
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      error: "Acesso negado. Permissões de administrador requeridas.",
    });
  }
  next();
};

// Middleware para verificar se o usuário é admin OU organizador
const requireAdminOrOrganizer = (req, res, next) => {
  const role = req.user.role;
  if (role !== "ADMIN" && role !== "ORGANIZER") {
    return res.status(403).json({
      error:
        "Acesso negado. Apenas administradores ou organizadores podem realizar esta ação.",
    });
  }
  next();
};

// Middleware para verificar se o usuário pode acessar o recurso (próprio usuário ou admin)
const requireOwnershipOrAdmin = (req, res, next) => {
  const userId = req.params.userId || req.params.id;

  if (req.user.role === "ADMIN" || req.user.id === userId) {
    next();
  } else {
    return res.status(403).json({
      error: "Acesso negado. Você só pode acessar seus próprios dados.",
    });
  }
};

// Middleware para verificar se o usuário pode acessar o recurso (próprio usuário, admin, ou organizador)
const requireOwnershipOrAdminOrOrganizer = (req, res, next) => {
  const userId = req.params.userId || req.params.id;
  const role = req.user.role;

  if (role === "ADMIN" || role === "ORGANIZER" || req.user.id === userId) {
    next();
  } else {
    return res.status(403).json({
      error: "Acesso negado. Você só pode acessar seus próprios dados.",
    });
  }
};

// Middleware para verificar se o usuário pode fazer check-in (ADMIN ou CHECKIN_COORDINATOR ou ORGANIZER)
const requireCheckinPermission = (req, res, next) => {
  const allowedRoles = ["ADMIN", "CHECKIN_COORDINATOR", "ORGANIZER"];

  if (allowedRoles.includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({
      error:
        "Acesso negado. Apenas administradores, coordenadores de check-in e organizadores podem realizar esta ação.",
    });
  }
};

// Middleware to optionally authenticate token (for public routes that adjust content based on auth)
const authenticateOptional = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (user) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  } catch (error) {
    // If token is invalid, treat as anonymous
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  authenticateOptional,
  requireAdmin,
  requireOwnershipOrAdmin,
  requireOwnershipOrAdminOrOrganizer,
  requireCheckinPermission,
  requireAdminOrOrganizer,
};
