const { body, validationResult } = require("express-validator");
const { prisma } = require("../config/database");
const { client: redis } = require("../services/cacheService");
const sharp = require("sharp");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fs = require("fs/promises");
const path = require("path");
const { publishToQueue } = require("../services/queueService");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Função auxiliar para invalidar cache de eventos
const invalidateEventCache = async () => {
  try {
    const keys = await redis.keys("express_cache:/api/events*");
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache] Invalidando ${keys.length} chaves de eventos.`);
    }
  } catch (error) {
    console.error("[Cache] Erro ao invalidar cache:", error);
  }
};
exports.invalidateEventCache = invalidateEventCache; // Export explicitly
const getCorrectedDate = (storedDate) => {
  if (!storedDate) return null;
  const isoString = storedDate.toISOString();
  const naiveDateTimeString = isoString.slice(0, -5); // Remove 'Z' e os segundos para simplificar
  const correctDateString = `${naiveDateTimeString}-03:00`;
  return new Date(correctDateString);
};

// Validações para evento
const eventValidation = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Título deve ter entre 3 e 255 caracteres"),
  body("description")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Descrição deve ter pelo menos 10 caracteres"),
  body("startDate").isISO8601().withMessage("Data de início inválida"),
  body("endDate").isISO8601().withMessage("Data de término inválida"),
  body("location")
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Local deve ter entre 3 e 255 caracteres"),
  body("maxAttendees")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Número máximo de participantes deve ser um número positivo"),
];

// Listar todos os eventos
const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, upcoming } = req.query;
    const skip = (page - 1) * limit;
    const user = req.user; // Usuário autenticado pelo middleware

    // Objeto base para a cláusula WHERE do Prisma
    const baseWhere = {};

    if (search) {
      baseWhere.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (upcoming === "true") {
      // O evento permanece visível por até 4 horas (14.400.000 ms) após o término
      const visibilityThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000);
      baseWhere.endDate = { gte: visibilityThreshold };
    }

    // Construção da cláusula final de visibilidade
    let finalWhere = { ...baseWhere };

    if (user) {
      if (user.role === "ADMIN") {
        // ADMIN vê tudo
      } else if (["GESTOR_ESCOLA", "ORGANIZER"].includes(user.role)) {
        // CORREÇÃO: Gestor e Organizador veem APENAS os eventos que eles mesmos criaram
        finalWhere.creatorId = user.id;
      } else if (["CHECKIN_COORDINATOR", "SPEAKER"].includes(user.role)) {
        // --- ALTERAÇÃO PRINCIPAL ---
        // Coordenadores e Palestrantes veem APENAS eventos onde estão na equipe (staff)
        // OU eventos públicos (dependendo da regra de negócio, mas geralmente staff vê o restrito)
        // Vamos assumir que eles veem os eventos onde são staff.

        finalWhere.staff = {
          some: {
            userId: user.id
          }
        };

        // Opcional: Se quiser que eles TAMBÉM vejam eventos públicos como participantes normais,
        // use um OR. Mas o pedido foi para "aparecerão os eventos em que ele foi vinculado".
        // Então mantemos restrito.
      } else {
        // Usuário comum (TEACHER, etc) vê eventos públicos OU os privados da sua escola
        const userWithWorkplaces = await prisma.user.findUnique({
          where: { id: user.id },
          select: { workplaces: { select: { id: true } } },
        });
        const userWorkplaceIds =
          userWithWorkplaces?.workplaces.map((w) => w.id) || [];

        if (userWorkplaceIds.length > 0) {
          const managers = await prisma.user.findMany({
            where: {
              role: "GESTOR_ESCOLA",
              workplaces: { some: { id: { in: userWorkplaceIds } } },
            },
            select: { id: true },
          });
          const managerIds = managers.map((m) => m.id);

          finalWhere.OR = [
            { isPrivate: false },
            { creatorId: { in: managerIds } },
          ];
        } else {
          // Se o usuário não tem escola, só vê eventos públicos
          finalWhere.isPrivate = false;
        }
      }
    } else {
      // Usuário ANÔNIMO: Vê apenas eventos públicos
      finalWhere.isPrivate = false;
    }

    // Combina a cláusula base com a de visibilidade, se necessário
    if (finalWhere.OR || finalWhere.creatorId) {
      finalWhere = { AND: [baseWhere, finalWhere] };
    }

    const events = await prisma.event.findMany({
      where: finalWhere,
      select: {
        id: true,
        title: true,
        isPrivate: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        maxAttendees: true,
        imageUrl: true,
        createdAt: true,
        badgeTemplateUrl: true,
        badgeTemplateConfig: true,
        certificateTemplateUrl: true,
        certificateTemplateConfig: true,
        parentId: true,
        schedule: true,
        speakerName: true,
        speakerRole: true,
        speakerPhotoUrl: true,
        mapLink: true,
        _count: {
          select: {
            enrollments: {
              where: { status: "APPROVED" },
            },
          },
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { startDate: "asc" },
    });

    const total = await prisma.event.count({ where: finalWhere });

    // Adicionar informações de disponibilidade
    const eventsWithAvailability = events.map((event) => ({
      ...event,
      enrolledCount: event._count.enrollments,
      availableSpots: event.maxAttendees
        ? event.maxAttendees - event._count.enrollments
        : null,
      isFull: event.maxAttendees
        ? event._count.enrollments >= event.maxAttendees
        : false,
    }));

    res.json({
      events: eventsWithAvailability,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar eventos:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Obter evento por ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: {
              where: { status: "APPROVED" },
            },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({
        error: "Evento não encontrado",
      });
    }

    // Adicionar informações de disponibilidade
    const eventWithAvailability = {
      ...event,
      enrolledCount: event._count.enrollments,
      availableSpots: event.maxAttendees
        ? event.maxAttendees - event._count.enrollments
        : null,
      isFull: event.maxAttendees
        ? event._count.enrollments >= event.maxAttendees
        : false,
    };

    res.json(eventWithAvailability);
  } catch (error) {
    console.error("Erro ao obter evento:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Criar evento
const createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: "Dados inválidos", details: errors.array() });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      location,
      maxAttendees,
      imageUrl,
      parentId,
      mapLink,
      schedule,
      speakerName,
      speakerRole,
      speakerPhotoUrl,
    } = req.body;

    // 1. Pegamos o usuário logado que está fazendo a requisição
    const user = req.user;

    if (new Date(startDate) >= new Date(endDate)) {
      return res
        .status(400)
        .json({ error: "Data de início deve ser anterior à data de término" });
    }

    // 2. Preparamos o objeto de dados para o Prisma
    const data = {
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      imageUrl: imageUrl || null,
      parentId: parentId || null,
      mapLink,
      schedule,
      speakerName,
      speakerRole,
      speakerPhotoUrl,
    };

    // 3. Se o criador for um GESTOR_ESCOLA ou ORGANIZER, marcamos o evento como privado e associamos o criador
    if (["GESTOR_ESCOLA", "ORGANIZER"].includes(user.role)) {
      data.isPrivate = true;
      data.creatorId = user.id;
    }

    const event = await prisma.event.create({ data });

    // Invalidar cache após criação
    await invalidateEventCache();

    res.status(201).json({ message: "Evento criado com sucesso", event });
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Atualizar evento
const updateEvent = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      maxAttendees,
      imageUrl,
      parentId,
      mapLink,
      schedule,
      speakerName,
      speakerRole,
      speakerPhotoUrl,
    } = req.body;

    // Verificar se o evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: "Evento não encontrado",
      });
    }

    // CHECK DE PROPRIEDADE: Organizador só edita o que criou
    if (req.user.role === "ORGANIZER" && existingEvent.creatorId !== req.user.id) {
      return res.status(403).json({
        error: "Acesso negado. Você só pode editar eventos que você criou.",
      });
    }

    // Validar se a data de início é anterior à data de término
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        error: "Data de início deve ser anterior à data de término",
      });
    }

    // Preparar dados para atualização
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (location) updateData.location = location;
    if (maxAttendees !== undefined) updateData.maxAttendees = maxAttendees ? parseInt(maxAttendees) : null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (mapLink !== undefined) updateData.mapLink = mapLink;
    if (schedule !== undefined) updateData.schedule = schedule;
    if (speakerName !== undefined) updateData.speakerName = speakerName;
    if (speakerRole !== undefined) updateData.speakerRole = speakerRole;
    if (speakerPhotoUrl !== undefined) updateData.speakerPhotoUrl = speakerPhotoUrl;

    // Atualizar evento
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    // Invalidar cache após atualização
    await invalidateEventCache();

    res.json({
      message: "Evento atualizado com sucesso",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Deletar evento
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({
        error: "Evento não encontrado",
      });
    }

    // CHECK DE PROPRIEDADE: Organizador só deleta o que criou
    if (req.user.role === "ORGANIZER" && event.creatorId !== req.user.id) {
      return res.status(403).json({
        error: "Acesso negado. Você só pode deletar eventos que você criou.",
      });
    }

    // Verificar se há inscrições no evento
    if (event._count.enrollments > 0) {
      return res.status(400).json({
        error: "Não é possível deletar evento com inscrições ativas",
      });
    }

    // Deletar evento
    await prisma.event.delete({
      where: { id },
    });

    // Invalidar cache após deleção
    await invalidateEventCache();

    res.json({
      message: "Deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar evento:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// NOVA FUNÇÃO: Para fazer upload do modelo de crachá e salvar a configuração
const uploadEventBadgeTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { badgeTemplateConfig } = req.body;

    // Verifica se o evento existe
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // CHECK DE PROPRIEDADE
    if (req.user.role === "ORGANIZER" && event.creatorId !== req.user.id) {
      return res.status(403).json({
        error: "Acesso negado. Você só pode gerenciar crachás de eventos que você criou.",
      });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Nenhuma imagem de modelo foi enviada" });
    }

    const updateData = {
      badgeTemplateUrl: `/${req.file.path.replace(/\\/g, "/")}`, // Normaliza o caminho para URL
    };

    // Valida e salva a configuração JSON
    if (badgeTemplateConfig) {
      try {
        updateData.badgeTemplateConfig = JSON.parse(badgeTemplateConfig);
      } catch (e) {
        return res.status(400).json({
          error: "Formato de badgeTemplateConfig inválido. Deve ser um JSON.",
        });
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: "Modelo de crachá atualizado com sucesso!",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Erro ao fazer upload do modelo de crachá:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// NOVA FUNÇÃO: Para gerar o PDF com todos os crachás dos inscritos
const generatePrintableBadges = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return res.status(404).json({
        error: "Evento não encontrado",
      });
    }

    // CHECK DE PROPRIEDADE
    if (req.user.role === "ORGANIZER" && event.creatorId !== req.user.id) {
      return res.status(403).json({
        error: "Acesso negado. Você só pode gerar crachás de eventos que você criou.",
      });
    }

    if (!event || !event.badgeTemplateUrl || !event.badgeTemplateConfig) {
      return res.status(404).json({
        error:
          "Evento não encontrado ou não possui um modelo de crachá configurado.",
      });
    }

    // Busca todos os usuários com inscrição aprovada no evento
    const enrollments = await prisma.enrollment.findMany({
      where: { eventId: id, status: "APPROVED" },
      include: {
        user: {
          include: {
            userBadge: true, // Inclui o crachá universal do usuário
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhum participante inscrito para gerar crachás." });
    }

    // Carrega o modelo de crachá
    const templatePath = path.join(process.cwd(), event.badgeTemplateUrl);
    const templateImageBuffer = await fs.readFile(templatePath);

    // Cria um novo documento PDF
    const pdfDoc = await PDFDocument.create();
    const config = event.badgeTemplateConfig;

    // Processa cada participante
    for (const enrollment of enrollments) {
      const user = enrollment.user;
      if (!user.userBadge?.qrCodeUrl) continue; // Pula se o usuário não tiver um QR Code

      // Cria um SVG para o texto (nome do usuário)
      const nameSvg = `
        <svg width="400" height="100">
          <text x="0" y="${config.name.fontSize || 24
        }" font-family="sans-serif" font-size="${config.name.fontSize || 24
        }" fill="${config.name.color || "#000000"}">
            ${user.name}
          </text>
        </svg>
      `;
      const nameBuffer = Buffer.from(nameSvg);

      // Carrega a imagem do QR Code universal do usuário
      const qrCodePath = path.join(process.cwd(), user.userBadge.qrCodeUrl);
      const qrCodeBuffer = await fs.readFile(qrCodePath);

      // Redimensiona o QR Code conforme a configuração
      const resizedQrCode = await sharp(qrCodeBuffer)
        .resize(config.qrCode.size || 100, config.qrCode.size || 100)
        .toBuffer();

      // Compõe o crachá final: template + nome + QR Code
      const finalBadgeBuffer = await sharp(templateImageBuffer)
        .composite([
          { input: nameBuffer, top: config.name.y, left: config.name.x },
          { input: resizedQrCode, top: config.qrCode.y, left: config.qrCode.x },
        ])
        .jpeg()
        .toBuffer();

      // Adiciona o crachá gerado a uma nova página do PDF
      const badgeImage = await pdfDoc.embedJpg(finalBadgeBuffer);
      const page = pdfDoc.addPage([badgeImage.width, badgeImage.height]);
      page.drawImage(badgeImage, {
        x: 0,
        y: 0,
        width: badgeImage.width,
        height: badgeImage.height,
      });
    }

    // Salva o PDF e envia para o cliente
    const pdfBytes = await pdfDoc.save();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="crachas_${event.title.replace(/\s/g, "_")}.pdf"`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Erro ao gerar crachás para impressão:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

const uploadCertificateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { certificateTemplateConfig } = req.body;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // CHECK DE PROPRIEDADE PARA ORGANIZADOR
    if (req.user.role === "ORGANIZER" && event.creatorId !== req.user.id) {
      return res.status(403).json({
        error: "Acesso negado. Você só pode gerenciar certificados de eventos que você criou.",
      });
    }

    // CORREÇÃO: Adicionada a validação que exige o envio do arquivo, igual à função do crachá.
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Nenhuma imagem de modelo de certificado foi enviada" });
    }

    // CORREÇÃO: 'updateData' agora é inicializado com a URL, garantindo que ela sempre seja salva.
    const updateData = {
      certificateTemplateUrl: `/${req.file.path.replace(/\\/g, "/")}`,
    };

    if (certificateTemplateConfig) {
      try {
        updateData.certificateTemplateConfig = JSON.parse(
          certificateTemplateConfig
        );
      } catch (e) {
        return res.status(400).json({
          error:
            "Formato de certificateTemplateConfig inválido. Deve ser um JSON.",
        });
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: "Modelo de certificado atualizado com sucesso!",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Erro no upload do modelo de certificado:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// NOVA FUNÇÃO: Para enviar certificados para todos os participantes elegíveis
const sendEventCertificates = async (req, res) => {
  const { id: parentEventId } = req.params; // Renomeado para clareza
  const adminEmail = req.user ? req.user.email : null; // Captura email do admin para notificação

  try {
    const parentEvent = await prisma.event.findUnique({
      where: { id: parentEventId },
    });

    if (!parentEvent) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // CHECK DE PROPRIEDADE
    if (req.user.role === "ORGANIZER" && parentEvent.creatorId !== req.user.id) {
      return res.status(403).json({
        error: "Acesso negado. Você só pode enviar certificados de eventos que você criou.",
      });
    }

    if (
      !parentEvent ||
      !parentEvent.certificateTemplateUrl ||
      !parentEvent.certificateTemplateConfig
    ) {
      return res.status(404).json({
        error:
          "Evento não encontrado ou não possui um modelo de certificado configurado.",
      });
    }

    // Publica na fila para processamento assíncrono
    const queueResult = await publishToQueue('email_queue', {
      type: 'SEND_CERTIFICATES',
      payload: {
        eventId: parentEventId,
        adminEmail: adminEmail // Opcional: para notificar quando terminar
      }
    });

    if (!queueResult) {
      return res.status(500).json({ error: "Falha ao conectar com serviço de filas. Tente novamente." });
    }

    // Retorna a resposta para o admin imediatamente
    res.status(202).json({
      message: `O processo de envio de certificados foi iniciado em segundo plano. Você será notificado ao final.`,
    });

  } catch (error) {
    console.error("Erro CRÍTICO ao iniciar o envio de certificados:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};


const getCertificateLogsForEvent = async (req, res) => {
  try {
    const { id: eventId } = req.params;

    // Verificar existência e propriedade
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    if (req.user.role === "ORGANIZER" && event.creatorId !== req.user.id) {
      return res.status(403).json({
        error: "Acesso negado. Você só pode ver logs de eventos que você criou.",
      });
    }

    // 1. Pega todos os participantes com inscrição aprovada no evento.
    const enrollments = await prisma.enrollment.findMany({
      where: {
        eventId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    // 2. Pega todos os logs de envio existentes para este evento.
    const logs = await prisma.certificateLog.findMany({
      where: { eventId },
      select: {
        userId: true,
        status: true,
        createdAt: true,
      },
    });

    // 3. Mapeia os logs por ID de usuário para uma busca rápida.
    const logMap = new Map(logs.map((log) => [log.userId, log]));

    // 4. Combina as duas listas para criar o relatório de status final.
    const statusReport = enrollments.map((enrollment) => {
      const log = logMap.get(enrollment.userId);
      return {
        userId: enrollment.user.id,
        userName: enrollment.user.name,
        userEmail: enrollment.user.email,
        status: log ? log.status : "PENDING", // Se não há log, o status é "Pendente"
        createdAt: log ? log.createdAt : null,
      };
    });

    res.json(statusReport);
  } catch (error) {
    console.error("Erro ao buscar status de certificados:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// --- NOVA FUNÇÃO PARA UPLOAD DA CAPA ---
const uploadEventThumbnailController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Nenhum arquivo de imagem foi enviado." });
    }

    // Normaliza o caminho para salvar no banco (ex: /uploads/events/...)
    const imageUrl = `/${req.file.path.replace(/\\/g, "/")}`;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // CHECK DE PROPRIEDADE
    if (req.user.role === "ORGANIZER" && event.creatorId !== req.user.id) {
      return res.status(403).json({
        error: "Acesso negado. Você só pode alterar a capa de eventos que você criou.",
      });
    }

    // Atualiza o evento no banco com a nova URL
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { imageUrl },
      select: { id: true, imageUrl: true }, // Retorna só o necessário
    });

    res.json({
      message: "Imagem de capa atualizada com sucesso!",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Erro no upload da capa do evento:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

// Upload da foto do palestrante
const uploadSpeakerPhotoController = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // CHECK DE PROPRIEDADE PARA ORGANIZADOR
    if (req.user.role === "ORGANIZER" && event.creatorId !== req.user.id) {
      return res.status(403).json({
        error: "Acesso negado. Você só pode alterar o palestrante de eventos que você criou.",
      });
    }

    // Normaliza o caminho do arquivo (com slash inicial)
    const imageUrl = `/${file.path.replace(/\\/g, "/")}`;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { speakerPhotoUrl: imageUrl },
    });

    res.json({
      message: "Foto do palestrante enviada com sucesso",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Erro ao fazer upload da foto do palestrante:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// --- NOVA FUNÇÃO: LISTAR INSCRITOS DE UM EVENTO ---
const getEventEnrollments = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // CHECK DE PROPRIEDADE
    if (req.user.role === "ORGANIZER" && event.creatorId !== req.user.id) {
      return res.status(403).json({
        error: "Acesso negado. Você só pode ver inscritos de eventos que você criou.",
      });
    }

    // Busca inscrições com dados do usuário
    const enrollments = await prisma.enrollment.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formata o retorno
    const formattedEnrollments = enrollments.map(enrollment => ({
      userId: enrollment.user.id,
      name: enrollment.user.name,
      email: enrollment.user.email,
      cpf: enrollment.user.cpf,
      phone: enrollment.user.phone,
      status: enrollment.status,
      enrolledAt: enrollment.createdAt,
      checkInTime: enrollment.checkInTime
    }));

    res.json(formattedEnrollments);
  } catch (error) {
    console.error("Erro ao listar inscritos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// --- NOVA FUNÇÃO: LISTAR PERGUNTAS DO EVENTO ---
const getEventQuestions = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // CHECK DE PROPRIEDADE
    if (req.user.role === "ORGANIZER" && event.creatorId !== req.user.id) {
      return res.status(403).json({
        error: "Acesso negado. Você só pode ver perguntas de eventos que você criou.",
      });
    }

    // Busca todas as perguntas do evento
    const questions = await prisma.question.findMany({
      where: { eventId: id },
      include: {
        user: { select: { id: true, name: true, photoUrl: true } }
      },
      orderBy: [
        { isHighlighted: 'desc' },
        { votes: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(questions);
  } catch (error) {
    console.error("Erro ao buscar perguntas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Upload de arquivo de apresentação (PDF/PPT)
const uploadPresentationFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Retorna a URL pública para o frontend
    const fileUrl = `/${req.file.path.replace(/\\/g, "/")}`;

    res.json({
      message: "Arquivo de apresentação enviado com sucesso",
      url: fileUrl
    });
  } catch (error) {
    console.error("Erro no upload da apresentação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Deletar arquivo de apresentação (Cleanup)
const deletePresentationFile = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL do arquivo não fornecida" });
    }

    // O caminho deve ser relativo à raiz do projeto (onde está a pasta uploads)
    // A URL vem como /uploads/presentations/filename.ext
    const filePath = path.join(process.cwd(), url.startsWith("/") ? url.slice(1) : url);

    try {
      await fs.unlink(filePath);
      console.log(`[CLEANUP] Arquivo removido: ${filePath}`);
    } catch (err) {
      console.warn(`[CLEANUP] Erro ao tentar remover arquivo (pode já não existir): ${err.message}`);
    }

    res.json({ message: "Limpeza concluída" });
  } catch (error) {
    console.error("Erro na limpeza da apresentação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  eventValidation,
  uploadEventBadgeTemplate,
  generatePrintableBadges,
  uploadCertificateTemplate,
  sendEventCertificates,
  getCertificateLogsForEvent,
  uploadEventThumbnailController,
  uploadSpeakerPhotoController,
  getEventEnrollments,
  getEventQuestions,
  uploadPresentationFile,
  deletePresentationFile
};
