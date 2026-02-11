// ALTERAÇÃO: Este controller foi massivamente simplificado para usar apenas o crachá universal.
const { prisma } = require("../config/database");
const { checkAndGrantAutomaticAwards } = require("./awardController");
const axios = require("axios");
const { Buffer } = require("buffer");
const { calculateAndSaveProgress } = require("./trackController");

/**
 * Corrige a data armazenada no banco (que foi salva como UTC por engano)
 * para um objeto Date que reflete o fuso horário correto (-03:00) para comparação.
 * @param {Date} storedDate O objeto Date vindo do Prisma.
 * @returns {Date} Um novo objeto Date com o fuso horário corrigido.
 */
const getCorrectedDate = (storedDate) => {
  if (!storedDate) return null;
  const isoString = storedDate.toISOString();
  const naiveDateTimeString = isoString.slice(0, -5); // Remove 'Z' e os segundos para simplificar
  const correctDateString = `${naiveDateTimeString}-03:00`;
  return new Date(correctDateString);
};

// Função principal para realizar o check-in.
const performCheckin = async (req, res) => {
  try {
    const { qrCodeValue, badgeCode, eventId } = req.body;

    if (!eventId) {
      return res
        .status(400)
        .json({ error: "É obrigatório selecionar um evento para o check-in" });
    }

    let userBadge;

    // Lógica para entrada manual com código do crachá.
    if (badgeCode) {
      userBadge = await prisma.userBadge.findUnique({
        where: { badgeCode: badgeCode.toUpperCase() },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      if (!userBadge) {
        return res
          .status(404)
          .json({ error: "Código de crachá não encontrado" });
      }
    }
    // Lógica para leitura de QR Code.
    else if (qrCodeValue) {
      let parsedData;
      try {
        parsedData = JSON.parse(qrCodeValue);
      } catch (parseError) {
        return res.status(400).json({ error: "Formato de QR code inválido" });
      }

      const { userId, badgeType } = parsedData;
      if (!userId || badgeType !== "user") {
        return res
          .status(400)
          .json({ error: "QR code inválido ou não é um crachá de usuário" });
      }

      userBadge = await prisma.userBadge.findUnique({
        where: { userId },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      if (!userBadge) {
        return res
          .status(404)
          .json({ error: "Crachá de usuário não encontrado" });
      }
    } else {
      return res
        .status(400)
        .json({ error: "QR code ou código do crachá são obrigatórios" });
    }

    // Chama a função auxiliar para processar o check-in.
    return await processUserCheckin(req, res, userBadge, eventId);
  } catch (error) {
    console.error("Erro ao realizar check-in:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Função auxiliar que centraliza a lógica de validação e criação do check-in.
const processUserCheckin = async (req, res, userBadge, eventId) => {
  try {
    const { location } = req.body;
    const userId = userBadge.user.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // Verifica se o usuário está inscrito e aprovado no evento.
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        eventId,
        status: "APPROVED",
      },
    });

    if (!enrollment) {
      return res.status(400).json({
        error:
          "Usuário não está inscrito ou a inscrição não foi aprovada para este evento",
      });
    }

    // Verifica se o evento está em andamento.
    const now = new Date();
    const correctedStartDate = getCorrectedDate(event.startDate);
    const correctedEndDate = getCorrectedDate(event.endDate);

    // 2. Criamos a nova data de início do check-in (30 minutos antes).
    //    Primeiro, criamos uma cópia da data de início para não alterar a original.
    const checkinStartTime = new Date(correctedStartDate);
    //    Depois, usamos setMinutes() para subtrair 30 minutos.
    checkinStartTime.setMinutes(checkinStartTime.getMinutes() - 30);

    if (now < checkinStartTime) {
      return res.status(400).json({ error: "Evento ainda não começou" });
    }
    if (now > correctedEndDate) {
      return res.status(400).json({ error: "Evento já terminou" });
    }

    // Previne check-ins duplicados em um curto período.
    const recentCheckin = await prisma.userCheckin.findFirst({
      where: {
        userBadgeId: userBadge.id,
        eventId,
      },
    });

    if (recentCheckin) {
      return res.status(409).json({
        // Usando 409 Conflict para indicar duplicidade
        error: "Check-in já realizado recentemente",
        lastCheckin: recentCheckin,
      });
    }

    // Cria o registro do check-in.
    const checkin = await prisma.userCheckin.create({
      data: {
        userBadgeId: userBadge.id,
        eventId,
        location: location || event.location,
      },
      include: {
        userBadge: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    checkAndGrantAutomaticAwards(userId);

    // Atualizar progresso em Trilhas de Formação
    try {
      const tracksToUpdate = await prisma.trackEvent.findMany({
        where: { eventId },
        select: { trackId: true }
      });

      for (const { trackId } of tracksToUpdate) {
        // Verifica se o usuário está inscrito na trilha antes de atualizar
        const enrollment = await prisma.trackEnrollment.findUnique({
          where: { trackId_userId: { trackId, userId } }
        });

        if (enrollment) {
          await calculateAndSaveProgress(userId, trackId);
        }
      }
    } catch (trackError) {
      console.error("Erro ao atualizar progresso da trilha:", trackError);
    }

    res.status(201).json({
      message: "Check-in realizado com sucesso",
      checkin,
    });
  } catch (error) {
    console.error("Erro ao processar check-in de usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Listar check-ins de um evento (admin)
const getEventCheckins = async (req, res) => {
  // ALTERAÇÃO: A query foi ajustada para o novo modelo de check-in.
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10, date } = req.query;
    const skip = (page - 1) * limit;

    let where = { eventId };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      where.checkinTime = { gte: startOfDay, lte: endOfDay };
    }

    const checkins = await prisma.userCheckin.findMany({
      where,
      include: {
        userBadge: {
          include: {
            user: {
              select: { id: true, name: true, email: true, photoUrl: true },
            },
          },
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { checkinTime: "desc" },
    });

    const total = await prisma.userCheckin.count({ where });

    res.json({
      checkins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar check-ins do evento:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Listar check-ins de um usuário
const getUserCheckins = async (req, res) => {
  // ALTERAÇÃO: A lógica foi simplificada para buscar apenas em UserCheckin.
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = { userBadge: { userId } };

    const checkins = await prisma.userCheckin.findMany({
      where,
      // É preciso incluir o evento, mas o UserCheckin não tem relação direta.
      // Uma melhoria futura seria adicionar a relação ou buscar o evento separadamente.
      // Por simplicidade, vamos manter assim por enquanto.
      orderBy: { checkinTime: "desc" },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const total = await prisma.userCheckin.count({ where });

    res.json({
      checkins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar check-ins do usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Obter estatísticas de check-in de um evento
const getEventCheckinStats = async (req, res) => {
  // ALTERAÇÃO: A query foi ajustada para o novo modelo de check-in.
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    const totalEnrollments = await prisma.enrollment.count({
      where: { eventId, status: "APPROVED" },
    });

    const uniqueCheckinsResult = await prisma.userCheckin.groupBy({
      by: ["userBadgeId"],
      where: { eventId },
    });
    const uniqueCheckins = uniqueCheckinsResult.length;

    const totalCheckins = await prisma.userCheckin.count({
      where: { eventId },
    });

    const checkinsByDay = await prisma.$queryRaw`
      SELECT 
        DATE(checkin_time AT TIME ZONE 'UTC') as date,
        COUNT(DISTINCT user_badge_id) as "uniqueCheckins",
        COUNT(id) as "totalCheckins"
      FROM user_checkins
      WHERE event_id = ${eventId}
      GROUP BY DATE(checkin_time AT TIME ZONE 'UTC')
      ORDER BY date
    `;

    res.json({
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
      },
      totalEnrollments,
      uniqueCheckins,
      totalCheckins,
      attendanceRate:
        totalEnrollments > 0
          ? ((uniqueCheckins / totalEnrollments) * 100).toFixed(2)
          : 0,
      checkinsByDay,
    });
  } catch (error) {
    console.error("Erro ao obter estatísticas de check-in:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// --- NOVA FUNÇÃO: CHECK-IN FACIAL ---
const performFacialCheckin = async (req, res) => {
  try {
    const { eventId, imageBase64 } = req.body; // Recebe eventId e imagem base64

    if (!eventId || !imageBase64) {
      return res
        .status(400)
        .json({ error: "eventId e imageBase64 são obrigatórios." });
    }

    // Valida o evento
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado." });
    }

    console.log(`[Facial Check-in] Iniciando para evento ${eventId}...`);

    // 1. Busca descritores dos inscritos E com consentimento
    const enrolledUsers = await prisma.user.findMany({
      where: {
        enrollments: { some: { eventId: eventId, status: "APPROVED" } },
        hasConsentFacialRecognition: true,
        faceDescriptor: { not: null },
      },
      select: { id: true, faceDescriptor: true },
    });

    if (enrolledUsers.length === 0) {
      console.log(
        `[Facial Check-in] Nenhum usuário inscrito com consentimento e descritor facial para evento ${eventId}.`
      );
      return res.status(404).json({
        error:
          "Nenhum participante habilitado para reconhecimento facial neste evento.",
      });
    }

    const knownDescriptors = enrolledUsers
      .map((u) => ({
        userId: u.id,
        descriptor: Array.isArray(u.faceDescriptor) ? u.faceDescriptor : [],
      }))
      .filter((u) => u.descriptor.length > 0);

    console.log(
      `[Facial Check-in] ${knownDescriptors.length} descritores conhecidos encontrados.`
    );

    // 2. Prepara a imagem e chama o serviço facial
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const facialServiceUrl = process.env.FACIAL_SERVICE_URL;

    if (!facialServiceUrl) {
      console.error(
        "[Facial Check-in] URL do serviço facial não configurada (FACIAL_SERVICE_URL)."
      );
      return res
        .status(500)
        .json({ error: "Serviço de reconhecimento facial não configurado." });
    }

    let matchedUserId = null;
    try {
      console.log(`[Facial Check-in] Chamando serviço facial para busca...`);
      const response = await axios.post(
        `${facialServiceUrl}/search-face?knownDescriptors=${encodeURIComponent(
          JSON.stringify(knownDescriptors)
        )}`,
        imageBuffer,
        // Assumindo JPEG por padrão, o frontend pode precisar especificar
        { headers: { "Content-Type": "image/jpeg" } }
      );
      matchedUserId = response.data.matchedUserId;
      console.log(
        `[Facial Check-in] Serviço facial respondeu com match: ${matchedUserId}`
      );
    } catch (error) {
      // Se o serviço facial retornar 404 (sem match), não é um erro fatal aqui
      if (error.response && error.response.status === 404) {
        console.log("[Facial Check-in] Serviço facial não encontrou match.");
      } else {
        // Outros erros (serviço indisponível, erro interno lá) são logados
        console.error(
          "[Facial Check-in] Erro ao chamar serviço facial:",
          error.response?.data || error.message
        );
        return res.status(500).json({
          error: "Falha na comunicação com o serviço de reconhecimento facial.",
        });
      }
    }

    // 3. Processa o resultado
    if (matchedUserId) {
      const userBadge = await prisma.userBadge.findUnique({
        where: { userId: matchedUserId },
        include: {
          user: {
            select: { id: true, name: true, email: true }, // Seleciona apenas o necessário
          },
        },
      });
      if (userBadge && userBadge.user) {
        // Reutiliza a lógica de check-in existente!
        console.log(
          `[Facial Check-in] Match válido. Processando check-in para ${matchedUserId}...`
        );
        return await processUserCheckin(req, res, userBadge, eventId);
      } else {
        console.error(
          `[Facial Check-in] CRÍTICO: UserBadge ou User associado não encontrado para matchedUserId ${matchedUserId}.`
        );
        return res
          .status(500)
          .json({
            error:
              "Erro interno: Dados do crachá/usuário não encontrados para usuário reconhecido.",
          });
      }
    } else {
      console.log(
        "[Facial Check-in] Nenhum match encontrado ou confiança insuficiente."
      );
      return res.status(404).json({
        error:
          "Rosto não reconhecido ou não corresponde a um inscrito habilitado.",
      });
    }
  } catch (error) {
    console.error("[Facial Check-in] Erro inesperado:", error);
    res
      .status(500)
      .json({ error: "Erro interno do servidor durante check-in facial." });
  }
};

module.exports = {
  performCheckin,
  getEventCheckins,
  getUserCheckins,
  getEventCheckinStats,
  performFacialCheckin,
  processUserCheckin,
};
