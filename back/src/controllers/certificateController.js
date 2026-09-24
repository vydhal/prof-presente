const { prisma } = require("../config/database");
const { PDFDocument, rgb } = require("pdf-lib"); // Biblioteca para manipular PDF
const fs = require("fs/promises");
const path = require("path");
const { generateCertificatePdf } = require("../services/certificateService");

// Função principal para gerar o certificado
const generateCertificate = async (req, res) => {
  try {
    const { parentEventId, userId } = req.params;

    // 1. Validar dados
    const parentEvent = await prisma.event.findUnique({
      where: { id: parentEventId },
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!parentEvent || !user) {
      return res
        .status(404)
        .json({ error: "Evento ou usuário não encontrado." });
    }
    if (!parentEvent.certificateTemplateUrl) {
      return res.status(400).json({
        error: "Este evento não possui um modelo de certificado configurado.",
      });
    }

    // 2. Encontrar todos os eventos-filho
    const childEvents = await prisma.event.findMany({
      where: { parentId: parentEventId },
    });
    const eventIds = [parentEventId, ...childEvents.map((e) => e.id)];

    // 3. Encontrar todos os check-ins do usuário nesses eventos
    const checkins = await prisma.userCheckin.findMany({
      where: {
        eventId: { in: eventIds },
        userBadge: { userId: userId },
      },
      include: { event: true },
    });

    if (checkins.length === 0) {
      return res
        .status(400)
        .json({ error: "Usuário não participou de nenhum evento do grupo." });
    }

    // 4. Calcular a soma das horas
    let totalMilliseconds = 0;
    const attendedEvents = new Set(); // Para não somar o mesmo evento várias vezes
    checkins.forEach((checkin) => {
      if (!attendedEvents.has(checkin.eventId)) {
        const duration =
          new Date(checkin.event.endDate) - new Date(checkin.event.startDate);
        totalMilliseconds += duration;
        attendedEvents.add(checkin.eventId);
      }
    });
    const roundedHours = Math.round(totalMilliseconds / (1000 * 60 * 60));
    const totalHours = roundedHours.toString().padStart(2, "0");
    // 5. Gerar o PDF usando o serviço padrão
    const templatePath = path.join(process.cwd(), parentEvent.certificateTemplateUrl);
    const templateImageBuffer = await fs.readFile(templatePath);
    const config = parentEvent.certificateTemplateConfig;

    // Carregar logo do branding se existir
    let brandingLogoBuffer = null;
    const settings = await prisma.systemSettings.findFirst();
    if (settings?.brandingLogoUrl) {
        try {
            brandingLogoBuffer = await fs.readFile(path.join(process.cwd(), settings.brandingLogoUrl));
        } catch (e) {
            console.warn("[CertificateController] Branding logo not found:", e.message);
        }
    }

    const pdfBytes = await generateCertificatePdf(
        user,
        config,
        templateImageBuffer,
        totalHours,
        parentEvent.startDate,
        brandingLogoBuffer,
        parentEvent.title
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificado_${user.name.replace(/\s+/g, "_")}.pdf"`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Erro ao gerar certificado:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

const generateTrackCertificate = async (req, res) => {
  try {
    const { trackId, userId } = req.params;

    // 1. Validar trilha e usuário
    const track = await prisma.learningTrack.findUnique({
      where: { id: trackId },
      include: {
        events: {
          include: { event: true },
          orderBy: { order: "asc" }
        },
        enrollments: {
          where: { userId }
        }
      }
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!track || !user) {
      return res.status(404).json({ error: "Trilha ou usuário não encontrado." });
    }

    const enrollment = track.enrollments[0];
    if (!enrollment || !enrollment.isCompleted) {
      return res.status(400).json({ error: "Você ainda não concluiu esta trilha." });
    }

    if (!track.certificateTemplateUrl) {
      return res.status(400).json({ error: "Esta trilha não possui um modelo de certificado configurado." });
    }

    // 2. Calcular total de horas da trilha
    let totalMilliseconds = 0;
    track.events.forEach(({ event }) => {
      const duration = new Date(event.endDate) - new Date(event.startDate);
      totalMilliseconds += duration;
    });

    const roundedHours = Math.round(totalMilliseconds / (1000 * 60 * 60));
    const totalHours = roundedHours.toString().padStart(2, "0");

    // 3. Gerar o PDF usando o serviço padrão
    const templatePath = path.join(process.cwd(), track.certificateTemplateUrl);
    const templateImageBuffer = await fs.readFile(templatePath);
    const config = track.certificateTemplateConfig;

    // Carregar logo do branding se existir
    let brandingLogoBuffer = null;
    const settings = await prisma.systemSettings.findFirst();
    if (settings?.brandingLogoUrl) {
        try {
            brandingLogoBuffer = await fs.readFile(path.join(process.cwd(), settings.brandingLogoUrl));
        } catch (e) {
            console.warn("[CertificateController] Branding logo not found:", e.message);
        }
    }

    const pdfBytes = await generateCertificatePdf(
        user,
        config,
        templateImageBuffer,
        totalHours,
        null, // Track certificates might not have a specific single event date
        brandingLogoBuffer,
        track.title
    );

    // 4. Salvar log
    await prisma.certificateLog.create({
      data: {
        userId,
        trackId,
        status: "SUCCESS"
      }
    });

    res.setHeader("Content-Disposition", `attachment; filename="certificado_trilha_${user.name.replace(/\s+/g, "_")}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Erro ao gerar certificado de trilha:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

const getMyCertificates = async (req, res) => {
  try {
    const userId = req.user.id;

    const certificates = await prisma.certificateLog.findMany({
      where: {
        userId,
        status: "SUCCESS",
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
        track: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(certificates);
  } catch (error) {
    console.error("Erro ao buscar certificados do usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

module.exports = { generateCertificate, generateTrackCertificate, getMyCertificates };
