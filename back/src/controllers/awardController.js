const { body, validationResult } = require("express-validator");
const { prisma } = require("../config/database");

// Validações para premiação
const awardValidation = [
  body("name")
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Nome deve ter entre 3 e 255 caracteres"),
  body("criteria")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Critérios devem ter pelo menos 10 caracteres"),
];

// Listar todas as premiações
const getAllAwards = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const awards = await prisma.award.findMany({
      include: {
        _count: {
          select: {
            userAwards: true,
          },
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.award.count();

    res.json({
      awards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar premiações:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Criar premiação
const createAward = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors.array(),
      });
    }

    const { name, description, criteria } = req.body;
    let imageUrl = null;

    // ALTERAÇÃO: Verifica se um arquivo foi enviado pelo middleware
    if (req.file) {
      // Constrói a URL que será salva no banco de dados
      imageUrl = `/${req.file.path.replace(/\\/g, "/")}`;
    }

    const award = await prisma.award.create({
      data: {
        name,
        description: description || null,
        criteria,
        imageUrl, // Salva o caminho do arquivo ou null
      },
    });

    res.status(201).json({
      message: "Premiação criada com sucesso",
      award,
    });
  } catch (error) {
    console.error("Erro ao criar premiação:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Listar premiações de um usuário
const getUserAwards = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const userAwards = await prisma.userAward.findMany({
      where: { userId },
      include: {
        award: true,
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { awardedAt: "desc" },
    });

    const total = await prisma.userAward.count({ where: { userId } });

    res.json({
      userAwards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar premiações do usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Conceder premiação a um usuário
const grantAwardToUser = async (req, res) => {
  try {
    const { userId, awardId } = req.body;

    if (!userId || !awardId) {
      return res.status(400).json({
        error: "ID do usuário e ID da premiação são obrigatórios",
      });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    // Verificar se a premiação existe
    const award = await prisma.award.findUnique({
      where: { id: awardId },
    });

    if (!award) {
      return res.status(404).json({
        error: "Premiação não encontrada",
      });
    }

    // Verificar se o usuário já possui esta premiação
    const existingUserAward = await prisma.userAward.findUnique({
      where: {
        userId_awardId: {
          userId,
          awardId,
        },
      },
    });

    if (existingUserAward) {
      return res.status(409).json({
        error: "Usuário já possui esta premiação",
      });
    }

    // Conceder premiação
    const userAward = await prisma.userAward.create({
      data: {
        userId,
        awardId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        award: true,
      },
    });

    res.status(201).json({
      message: "Premiação concedida com sucesso",
      userAward,
    });
  } catch (error) {
    console.error("Erro ao conceder premiação:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// ALTERAÇÃO: Lógica de premiação automática foi reescrita e aprimorada
const checkAndGrantAutomaticAwards = async (userId) => {
  try {
    // 1. Obter todas as premiações que o usuário já possui para evitar duplicatas
    const userAwards = await prisma.userAward.findMany({
      where: { userId },
      include: { award: true },
    });
    const userAwardIds = userAwards.map((ua) => ua.award.id);

    // 2. Obter as estatísticas de participação do usuário
    const totalCheckins = await prisma.userCheckin.count({
      where: { userBadge: { userId } },
    });

    const distinctEventsAttended = await prisma.userCheckin.groupBy({
      by: ["eventId"],
      where: { userBadge: { userId } },
    });
    const totalEventsAttended = distinctEventsAttended.length;

    // 3. Obter todas as premiações possíveis do banco
    const allPossibleAwards = await prisma.award.findMany();

    // 4. Lógica para verificar e conceder cada prêmio
    for (const award of allPossibleAwards) {
      // Pula se o usuário já tiver este prêmio
      if (userAwardIds.includes(award.id)) {
        continue;
      }

      let shouldGrant = false;
      // Compara as estatísticas do usuário com os critérios da premiação
      switch (award.criteria) {
        case "Realizar o primeiro check-in em qualquer evento":
          if (totalCheckins >= 1) shouldGrant = true;
          break;
        case "Realizar check-in em 3 eventos diferentes":
          if (totalEventsAttended >= 3) shouldGrant = true;
          break;
        case "Realizar 5 check-ins ou mais":
          if (totalCheckins >= 5) shouldGrant = true;
          break;
        case "Realizar 10 check-ins ou mais":
          if (totalCheckins >= 10) shouldGrant = true;
          break;
        // ATENÇÃO: O critério "Participar de 5 eventos de tecnologia" exige
        // uma lógica mais complexa (como tags ou categorias nos eventos),
        // que não implementaremos agora para manter a simplicidade.
      }

      if (shouldGrant) {
        await prisma.userAward.create({
          data: {
            userId,
            awardId: award.id,
          },
        });
      }
    }
  } catch (error) {
    // Silencioso no lado do cliente, mas loga o erro no servidor
    console.error(
      `Erro ao verificar premiações automáticas para o usuário ${userId}:`,
      error
    );
  }
};

// Ranking de usuários por premiações
const getAwardsRanking = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const ranking = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        photoUrl: true,
        _count: {
          select: {
            userAwards: true,
            enrollments: {
              where: { status: "APPROVED" },
            },
          },
        },
      },
      orderBy: {
        userAwards: {
          _count: "desc",
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const total = await prisma.user.count();

    const rankingWithPosition = ranking.map((user, index) => ({
      position: skip + index + 1,
      ...user,
      totalAwards: user._count.userAwards,
      totalEvents: user._count.enrollments,
    }));

    res.json({
      ranking: rankingWithPosition,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao obter ranking de premiações:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// NOVA FUNÇÃO: Atualizar uma premiação
const updateAward = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, criteria } = req.body;

    const dataToUpdate = { name, description, criteria };

    if (req.file) {
      dataToUpdate.imageUrl = `/${req.file.path.replace(/\\/g, "/")}`;
      // Futura melhoria: deletar a imagem antiga do servidor
    }

    const updatedAward = await prisma.award.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({
      message: "Premiação atualizada com sucesso",
      award: updatedAward,
    });
  } catch (error) {
    console.error("Erro ao atualizar premiação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// NOVA FUNÇÃO: Deletar uma premiação
const deleteAward = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.award.delete({
      where: { id },
    });

    res.json({ message: "Premiação deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar premiação:", error);
    // Adiciona uma verificação para erros de chave estrangeira
    if (error.code === "P2003") {
      return res.status(400).json({
        error:
          "Não é possível deletar esta premiação, pois ela já foi concedida a um ou mais usuários.",
      });
    }
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

module.exports = {
  getAllAwards,
  createAward,
  getUserAwards,
  grantAwardToUser,
  checkAndGrantAutomaticAwards,
  getAwardsRanking,
  awardValidation,
  updateAward,
  deleteAward,
};
