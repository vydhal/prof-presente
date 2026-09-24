// NOVO: Este controller foi criado para centralizar a lógica de ranking.
const { prisma } = require("../config/database");

// Função para gerar o ranking unificado de usuários com base nos check-ins.
const getCheckinRanking = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // 1. Agrupa por usuário E por evento para encontrar participações únicas.
    const uniqueParticipations = await prisma.userCheckin.groupBy({
      by: ["userBadgeId", "eventId"],
      _count: {
        _all: true, // A contagem aqui não importa, apenas o agrupamento
      },
    });

    // 2. Agrega em memória para contar quantos eventos únicos cada usuário participou.
    const userEventCounts = uniqueParticipations.reduce(
      (acc, participation) => {
        const userId = participation.userBadgeId;
        acc[userId] = (acc[userId] || 0) + 1;
        return acc;
      },
      {}
    );

    // 3. Transforma o objeto em um array e ordena para criar o ranking.
    const sortedUsers = Object.entries(userEventCounts)
      .map(([userBadgeId, totalCheckins]) => ({
        userBadgeId,
        totalCheckins, // totalCheckins agora significa "eventos únicos"
      }))
      .sort((a, b) => b.totalCheckins - a.totalCheckins)
      .slice(0, parseInt(limit)); // Aplica o limite

    if (sortedUsers.length === 0) {
      return res.json({ rankings: [] });
    }

    const userBadgeIds = sortedUsers.map((item) => item.userBadgeId);

    // 4. Busca os detalhes dos usuários do ranking.
    const userBadges = await prisma.userBadge.findMany({
      where: {
        id: { in: userBadgeIds },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, photoUrl: true },
        },
      },
    });

    // 5. Mapeia os dados para a resposta final, adicionando a posição.
    const rankings = sortedUsers
      .map((rankedUser, index) => {
        const userBadge = userBadges.find(
          (ub) => ub.id === rankedUser.userBadgeId
        );
        if (!userBadge || !userBadge.user) return null;

        return {
          position: index + 1,
          totalCheckins: rankedUser.totalCheckins, // Este é o número de eventos únicos.
          user: userBadge.user,
        };
      })
      .filter(Boolean); // Remove nulos

    res.json({ rankings });
  } catch (error) {
    console.error("Erro ao gerar ranking de check-ins:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// FUNÇÃO Ranking de Pontualidade - VERSÃO FINAL CORRIGIDA
const getPunctualityRanking = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const rankings = await prisma.$queryRaw`
      SELECT
        u.id,
        u.name,
        u.email,
        u."photoUrl",
        -- MUDANÇA: Agora contamos os eventos distintos em vez de todos os check-ins.
        COUNT(DISTINCT uc."eventId")::int AS "punctualCheckins"
      FROM
        user_checkins AS uc
      INNER JOIN
        events AS e ON uc."eventId" = e.id
      INNER JOIN
        user_badges AS ub ON uc."userBadgeId" = ub.id
      INNER JOIN
        users AS u ON ub."userId" = u.id
      WHERE
        uc."checkinTime" <= e."startDate"
      GROUP BY
        u.id, u."photoUrl"
      ORDER BY
        "punctualCheckins" DESC
      LIMIT ${parseInt(limit)};
    `;

    const formattedRankings = rankings.map((user, index) => ({
      position: index + 1,
      punctualCheckins: user.punctualCheckins,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
      },
    }));

    res.json({ rankings: formattedRankings });
  } catch (error) {
    console.error("Erro ao gerar ranking de pontualidade:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

module.exports = {
  getCheckinRanking,
  getPunctualityRanking,
};
