// NOVO: Este arquivo substitui o userBadgeController.js, teacherBadgeController.js e badgeController.js.
// Ele gerencia apenas o crachá universal do usuário.
const { prisma } = require("../config/database");
const { generateQRCode } = require("../utils/qrcode");
const nodeHtmlToImage = require("node-html-to-image");
const { generateBadgeHtml } = require("../utils/badgeService");
const badgeService = require("../services/badgeService");



// Criar crachá universal do usuário. Geralmente chamado por um administrador.
const createUserBadge = async (req, res) => {
  try {
    const { userId } = req.params;

    const existingBadge = await prisma.userBadge.findUnique({
      where: { userId },
    });

    if (existingBadge) {
      return res.status(409).json({
        error: "Usuário já possui um crachá",
        badge: existingBadge,
      });
    }

    const userBadge = await badgeService.findOrCreateUserBadge(userId);

    res.status(201).json({
      message: "Crachá universal criado com sucesso",
      badge: userBadge,
    });
  } catch (error) {
    console.error("Erro ao criar crachá universal:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Obter crachá universal de um usuário específico.
const getUserBadge = async (req, res) => {
  try {
    const { userId } = req.params;

    const userBadge = await prisma.userBadge.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
          },
        },
        _count: {
          select: {
            userCheckins: true,
          },
        },
      },
    });

    if (!userBadge) {
      return res.status(404).json({ error: "Crachá não encontrado" });
    }

    // ALTERAÇÃO: Simplificada a verificação de permissão.
    // Antes, verificava se era o próprio usuário ou admin.
    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return res
        .status(403)
        .json({ error: "Você não tem permissão para acessar este crachá" });
    }

    res.json(userBadge);
  } catch (error) {
    console.error("Erro ao obter crachá:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Obter o crachá do próprio usuário logado. Cria um automaticamente se não existir.
const getMyUserBadge = async (req, res) => {
  try {
    const userId = req.user.id;

    let userBadge = await prisma.userBadge.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
          },
        },
        _count: {
          select: {
            userCheckins: true,
          },
        },
      },
    });

    // Se o crachá não existir, cria um na hora.
    // Se o crachá não existir, cria um na hora.
    if (!userBadge) {
      // Usa o serviço para criar e já recebe o objeto completo (incluindo user se o serviço incluir, mas aqui precisamos garantir o retorno)
      // O serviço findOrCreateUserBadge retorna o userBadge. Vamos buscá-lo novamente com os includes que precisamos ou confiar no serviço?
      // O serviço retorna userBadge. Vamos usar ele.

      const createdBadge = await badgeService.findOrCreateUserBadge(userId);

      // Recarrega com os includes necessários para o frontend
      userBadge = await prisma.userBadge.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              photoUrl: true,
            },
          },
          _count: {
            select: {
              userCheckins: true,
            },
          },
        },
      });
    }

    res.json(userBadge);
  } catch (error) {
    console.error("Erro ao obter meu crachá:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Validar crachá universal (por QR code ou código manual).
const validateUserBadge = async (req, res) => {
  try {
    const { badgeCode, qrData } = req.body;
    let userBadge;

    if (qrData) {
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch (parseError) {
        return res.status(400).json({ error: "Formato de QR code inválido" });
      }

      // ALTERAÇÃO: Simplificado para validar apenas crachás de usuário.
      const { userId, badgeType } = parsedData;
      if (!userId || badgeType !== "user") {
        return res
          .status(400)
          .json({ error: "QR code inválido ou não é um crachá de usuário" });
      }

      userBadge = await prisma.userBadge.findUnique({
        where: { userId },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });
    } else if (badgeCode) {
      userBadge = await prisma.userBadge.findUnique({
        where: { badgeCode: badgeCode.toUpperCase() },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });
    } else {
      return res
        .status(400)
        .json({ error: "Código ou QR code são obrigatórios" });
    }

    if (!userBadge) {
      return res
        .status(404)
        .json({ error: "Crachá não encontrado", valid: false });
    }

    res.json({
      message: "Crachá válido",
      valid: true,
      badge: {
        id: userBadge.id,
        badgeCode: userBadge.badgeCode,
        user: userBadge.user,
        type: "user",
      },
    });
  } catch (error) {
    console.error("Erro ao validar crachá:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Buscar usuários por nome para autocomplete na tela de check-in.
const searchUsersByName = async (req, res) => {
  try {
    const { query, eventId } = req.query;

    if (!query || query.length < 2) {
      return res.json({ users: [] });
    }

    const where = {
      name: { contains: query, mode: "insensitive" },
    };

    // Se um eventId for fornecido, filtramos apenas usuários inscritos nele
    if (eventId) {
      where.enrollments = {
        some: {
          eventId,
          status: "APPROVED",
        },
      };
    }

    // Consulta única e otimizada que busca o usuário e seu crachá de uma vez
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        photoUrl: true,
        userBadge: {
          // Inclui o crachá relacionado diretamente na consulta
          select: {
            badgeCode: true,
          },
        },
      },
      take: 10,
      orderBy: { name: "asc" },
    });

    // Formata o resultado para o frontend
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      badgeCode: user.userBadge?.badgeCode || null, // Acessa o código do crachá
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Gerar crachás para todos os usuários existentes que não possuem um.
const generateMissingBadges = async (req, res) => {
  try {
    // 1. Encontra todos os usuários que NÃO possuem um UserBadge vinculado.
    const usersWithoutBadge = await prisma.user.findMany({
      where: {
        userBadge: null, // Filtra usuários onde a relação com UserBadge é nula
      },
    });

    if (usersWithoutBadge.length === 0) {
      return res.json({ message: "Todos os usuários já possuem crachás." });
    }

    // 2. Responde imediatamente ao admin, informando que o processo começou.
    res.status(202).json({
      message: `Processo iniciado. Criando crachás para ${usersWithoutBadge.length} usuários em segundo plano.`,
    });

    // 3. Executa a criação dos crachás em segundo plano para não travar a API.
    (async () => {
      console.log(
        `Iniciando a criação de ${usersWithoutBadge.length} crachás...`
      );
      for (const user of usersWithoutBadge) {
        try {
          // Reutiliza a mesma lógica de criação de crachá
          // Reutiliza a mesma lógica de criação de crachá do serviço
          await badgeService.findOrCreateUserBadge(user.id);
          console.log(
            `Crachá criado para o usuário: ${user.name} (${user.id})`
          );
        } catch (error) {
          console.error(
            `Falha ao criar crachá para o usuário ${user.id}:`,
            error
          );
        }
      }
      console.log("Criação de crachás em lote finalizada.");
    })();
  } catch (error) {
    console.error("Erro ao iniciar a geração de crachás faltantes:", error);
    res
      .status(500)
      .json({ error: "Erro interno do servidor ao iniciar o processo." });
  }
};

// Obter a contagem de usuários que não possuem um crachá universal.
const getMissingBadgesCount = async (req, res) => {
  try {
    const count = await prisma.user.count({
      where: {
        userBadge: null,
      },
    });
    res.json({ count });
  } catch (error) {
    console.error("Erro ao contar usuários sem crachá:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

/**
 * Gera e envia o crachá do usuário logado como um arquivo PNG para download.
 * Usa a mesma lógica HTML da confirmação de e-mail.
 */
const downloadMyUserBadge = async (req, res) => {
  try {
    const userId = req.user.id; // Pego pelo middleware authenticateToken

    // 1. Buscar todos os dados necessários (usuário, crachá, premiações)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const userBadge = await prisma.userBadge.findUnique({
      where: { userId },
    });

    // Busca as 5 primeiras premiações (assim como no frontend)
    const userAwardsData = await prisma.userAward.findMany({
      where: { userId },
      include: { award: true }, // Inclui os dados do 'award'
      take: 5,
      orderBy: { awardedAt: "desc" }, // Garante que pegamos as mais recentes
    });

    if (!user || !userBadge) {
      return res
        .status(404)
        .json({ error: "Dados do usuário ou crachá não encontrados." });
    }

    // 2. Gerar o HTML (a "fonte da verdade" do seu e-mail)
    const badgeHtml = await generateBadgeHtml(user, userBadge, userAwardsData);

    // 3. Converter o HTML em um Buffer de imagem PNG
    const imageBuffer = await nodeHtmlToImage({
      html: badgeHtml,
      type: "png",
      quality: 100,
      selector: '#badge-container',
      puppeteerArgs: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Também é uma boa prática em Docker
        ],
      },
    });

    // 4. Enviar a imagem como um anexo de download
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="cracha_${user.name.replace(/\s+/g, "_")}.png"`
    );
    res.send(imageBuffer);
  } catch (error) {
    console.error("Erro ao gerar PNG do crachá no backend:", error);
    res.status(500).json({ error: "Erro ao gerar imagem do crachá." });
  }
};

module.exports = {
  createUserBadge,
  getUserBadge,
  getMyUserBadge,
  validateUserBadge,
  searchUsersByName,
  generateMissingBadges,
  getMissingBadgesCount,
  downloadMyUserBadge,
};
