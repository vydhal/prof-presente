const { prisma } = require("../config/database");

const {
  sendEnrollmentConfirmationEmail,
  sendEnrollmentCancellationEmail,
} = require("../utils/email");
const { findOrCreateUserBadge } = require("../services/badgeService");

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

// Inscrever usuário em evento
const enrollInEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId || req.body.eventId;
    const userId = req.user.id;

    if (!eventId) {
      return res.status(400).json({ error: "eventId é obrigatório" });
    }

    const [event, user, userAwards] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: { enrollments: { where: { status: "APPROVED" } } },
          },
        },
      }),
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.userAward.findMany({
        // Query para buscar as premiações
        where: { userId },
        include: { award: true },
        orderBy: { awardedAt: "desc" },
        take: 5,
      }),
    ]);

    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    if (!user) {
      return res
        .status(404)
        .json({ error: "Dados do usuário não encontrados." });
    }

    // GARANTIA: Busca ou cria o crachá aqui para garantir que o QR Code exista
    const userBadge = await findOrCreateUserBadge(userId);

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });

    if (existingEnrollment) {
      if (["CANCELLED", "REJECTED"].includes(existingEnrollment.status)) {
        if (new Date() > getCorrectedDate(event.endDate)) {
          return res.status(400).json({
            error: "Não é possível se inscrever em evento que já terminou",
          });
        }
        if (
          event.maxAttendees &&
          event._count.enrollments >= event.maxAttendees
        ) {
          return res
            .status(400)
            .json({ error: "Evento lotado. Não há mais vagas disponíveis." });
        }

        const enrollment = await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: "APPROVED", enrollmentDate: new Date() },
          include: {
            user: { select: { id: true, name: true, email: true } },
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                location: true,
              },
            },
          },
        });

        // --- MUDANÇA: Dispara o e-mail de confirmação ao reativar a inscrição ---
        sendEnrollmentConfirmationEmail(user, event, userBadge, userAwards);

        // ALTERAÇÃO: A geração de crachá foi removida daqui.
        return res
          .status(200)
          .json({ message: "Inscrição reativada com sucesso", enrollment });
      } else {
        return res.status(409).json({
          error: "Usuário já está inscrito neste evento",
          enrollment: existingEnrollment,
        });
      }
    }

    if (new Date() > getCorrectedDate(event.endDate)) {
      return res.status(400).json({
        error: "Não é possível se inscrever em evento que já terminou",
      });
    }

    if (event.maxAttendees && event._count.enrollments >= event.maxAttendees) {
      return res
        .status(400)
        .json({ error: "Evento lotado. Não há mais vagas disponíveis." });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        eventId,
        status: "APPROVED",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
      },
    });

    // ALTERAÇÃO: A geração automática de crachá foi removida daqui.
    // O crachá universal do usuário será usando a variável já carregada acima.

    // --- MUDANÇA: Dispara o e-mail de confirmação ao reativar a inscrição ---
    sendEnrollmentConfirmationEmail(user, event, userBadge, userAwards);

    res.status(201).json({
      message: "Inscrição realizada com sucesso",
      enrollment,
    });
  } catch (error) {
    console.error("Erro ao inscrever usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// ALTERAÇÃO: A função auxiliar "generateBadgeForEnrollment" foi completamente removida.

// Listar inscrições do usuário
const getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = { userId };
    if (status) {
      where.status = status.toUpperCase(); // Garante consistência
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
            imageUrl: true,
          },
        },
        // ALTERAÇÃO: A inclusão do Badge foi removida.
        courseEvaluation: { select: { id: true } },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { enrollmentDate: "desc" },
    });

    const total = await prisma.enrollment.count({ where });

    res.json({
      enrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar inscrições do usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Listar inscrições de um evento (admin)
const getEventEnrollments = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = { eventId };
    if (status) {
      where.status = status.toUpperCase();
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, photoUrl: true },
        },
        // ALTERAÇÃO: A inclusão do Badge foi removida daqui também.
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { enrollmentDate: "desc" },
    });

    const total = await prisma.enrollment.count({ where });

    res.json({
      enrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar inscrições do evento:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Cancelar inscrição
const cancelEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { event: true, user: true },
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Inscrição não encontrada" });
    }

    if (req.user.role !== "ADMIN" && enrollment.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Você não tem permissão para cancelar esta inscrição" });
    }

    // 1. Pega a data/hora do banco (que é um objeto Date interpretado como UTC).
    const storedDate = enrollment.event.startDate;

    // 2. Converte para uma string no formato ISO ('YYYY-MM-DDTHH:mm:ss.sssZ').
    const isoString = storedDate.toISOString();

    // 3. Remove o 'Z' final para obter uma string de data/hora "ingênua",
    //    tratando-a como se fosse a hora local correta.
    const naiveDateTimeString = isoString.slice(0, -5); // Remove 'Z' e segundos/millis para simplicidade

    // 4. Anexa o fuso horário correto de Brasília (-03:00) à string.
    //    Isso diz ao JavaScript: "interprete esta data/hora como se estivesse no fuso -03:00".
    const correctDateString = `${naiveDateTimeString}-03:00`;

    // 5. Cria o objeto Date correto a partir da string com o fuso ajustado.
    const correctStartDate = new Date(correctDateString);

    if (new Date() > correctStartDate) {
      return res.status(400).json({
        error: "Não é possível cancelar inscrição de evento que já começou",
      });
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "CANCELLED" },
    });

    // --- MUDANÇA: Dispara o e-mail de cancelamento ---
    // Usamos os dados que já foram buscados no 'include'
    sendEnrollmentCancellationEmail(enrollment.user, enrollment.event);

    res.json({
      message: "Inscrição cancelada com sucesso",
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("Erro ao cancelar inscrição:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Atualizar status da inscrição (admin)
const updateEnrollmentStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status } = req.body;

    if (!["PENDING", "APPROVED", "CANCELLED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) {
      return res.status(404).json({ error: "Inscrição não encontrada" });
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true } },
      },
    });

    res.json({
      message: "Status da inscrição atualizado com sucesso",
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("Erro ao atualizar status da inscrição:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Listar inscrições do usuário logado
const getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = { userId };
    if (status && status.toLowerCase() !== "all") {
      // ALTERAÇÃO: Garante que "all" não filtre
      where.status = status.toUpperCase();
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
            imageUrl: true,
          },
        },
        // ALTERAÇÃO: A inclusão do Badge foi removida.
        courseEvaluation: { select: { id: true } },
      },
      orderBy: { enrollmentDate: "desc" },
      skip: parseInt(skip),
      take: parseInt(limit),
    });

    const total = await prisma.enrollment.count({ where });

    res.json({
      enrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar minhas inscrições:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Reenviar e-mail de confirmação (Admin)
const resendConfirmationEmail = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: true,
        event: true,
      },
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Inscrição não encontrada" });
    }

    if (enrollment.status !== "APPROVED") {
      return res
        .status(400)
        .json({ error: "A inscrição não está aprovada para reenviar e-mail." });
    }

    // Busca ou cria o crachá para garantir o QR Code
    const userBadge = await findOrCreateUserBadge(enrollment.userId);

    // Busca premiações para compor o crachá no email
    const userAwards = await prisma.userAward.findMany({
      where: { userId: enrollment.userId },
      include: { award: true },
      orderBy: { awardedAt: "desc" },
      take: 5,
    });

    // Reenvia o e-mail
    await sendEnrollmentConfirmationEmail(
      enrollment.user,
      enrollment.event,
      userBadge,
      userAwards
    );

    res.json({ message: "E-mail de confirmação reenviado com sucesso." });
  } catch (error) {
    console.error("Erro ao reenviar e-mail:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

module.exports = {
  enrollInEvent,
  getUserEnrollments,
  getMyEnrollments,
  getEventEnrollments,
  cancelEnrollment,
  updateEnrollmentStatus,
  resendConfirmationEmail,
};
