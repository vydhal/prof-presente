const { prisma } = require("../config/database");
const sharp = require("sharp");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fs = require("fs/promises");
const path = require("path");
const { sendEmail } = require("../utils/email");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Função auxiliar para gerar PDF
const generateCertificatePdf = async (user, config, templateImageBuffer, totalHours, eventDate, brandingLogoBuffer, eventTitle) => {
  const pdfDoc = await PDFDocument.create();
  
  // Registrar fontes
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  const getFont = (family) => {
    if (!family) return fontRegular;
    const f = family.toLowerCase();
    if (f.includes('serif') && !f.includes('sans')) return fontSerif;
    if (f.includes('mono')) return fontMono;
    return fontRegular;
  };

  const page = pdfDoc.addPage([842, 595]); // A4 Landscape
  const { width, height } = page.getSize();

  // 1. Desenhar Fundo
  if (templateImageBuffer) {
    try {
        let templateImage;
        try {
            templateImage = await pdfDoc.embedJpg(templateImageBuffer);
        } catch (e) {
            templateImage = await pdfDoc.embedPng(templateImageBuffer);
        }
        page.drawImage(templateImage, { x: 0, y: 0, width: width, height: height });
    } catch (e) {
        console.error("[CertificateService] Error embedding template image:", e.message);
    }
  } else {
    // Fundo branco com borda sutil
    page.drawRectangle({
        x: 10, y: 10, width: width - 20, height: height - 20,
        borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 2,
    });
  }

  // Helper para converter Hex para RGB do pdf-lib
  const hexToRgb = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return rgb(0, 0, 0);
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };

  // 2. Desenhar Logo (Branding)
  if (brandingLogoBuffer && config.logo) {
      try {
          let logoImage;
          try {
              logoImage = await pdfDoc.embedPng(brandingLogoBuffer);
          } catch (e) {
              logoImage = await pdfDoc.embedJpg(brandingLogoBuffer);
          }
          const logoSize = parseInt(config.logo.size) || 80;
          const logoX = parseInt(config.logo.x) || 40;
          const logoY = height - (parseInt(config.logo.y) || 40) - logoSize;

          page.drawImage(logoImage, { x: logoX, y: logoY, width: logoSize, height: logoSize });
      } catch (e) {
          console.warn("[CertificateService] Error embedding branding logo:", e.message);
      }
  }

  // 3. Nome do Participante
  if (config.name) {
    const fontSize = parseInt(config.name.fontSize) || 32;
    page.drawText(user.name, {
      x: parseInt(config.name.x) || 50,
      y: height - (parseInt(config.name.y) || 120) - fontSize,
      size: fontSize,
      font: getFont(config.name.fontFamily),
      color: hexToRgb(config.name.color),
    });
  }

  // 4. Carga Horária
  if (config.hours) {
    const fontSize = parseInt(config.hours.fontSize) || 20;
    page.drawText(`${totalHours} h`, {
      x: parseInt(config.hours.x) || 50,
      y: height - (parseInt(config.hours.y) || 180) - fontSize,
      size: fontSize,
      font: getFont(config.hours.fontFamily),
      color: hexToRgb(config.hours.color),
    });
  }

  // 5. Data do Evento
  if (config.date && eventDate) {
    const fontSize = parseInt(config.date.fontSize) || 18;
    const formattedDate = new Date(eventDate).toLocaleDateString("pt-BR");
    page.drawText(formattedDate, {
        x: parseInt(config.date.x) || 50,
        y: height - (parseInt(config.date.y) || 220) - fontSize,
        size: fontSize,
        font: getFont(config.date.fontFamily),
        color: hexToRgb(config.date.color),
    });
  }

  // 6. Texto Customizado (Frase) com Placeholders e Wrapping
  if (config.phrase && config.phrase.text) {
      let text = config.phrase.text;
      // Substituições insensíveis a maiúsculas/minúsculas
      text = text.replace(/{nome}/gi, user.name);
      text = text.replace(/{horas}/gi, totalHours);
      text = text.replace(/{data}/gi, eventDate ? new Date(eventDate).toLocaleDateString("pt-BR") : "");
      text = text.replace(/{evento}/gi, eventTitle || "");
      text = text.replace(/{curso}/gi, eventTitle || ""); // Alias comum
      
      // Sanitizar: pdf-lib com fontes padrões não aceita quebras de linha (0x000a) dentro do drawText
      text = text.replace(/\r?\n/g, " ");
      
      const fontSize = parseInt(config.phrase.fontSize) || 16;
      const color = hexToRgb(config.phrase.color);
      const maxWidth = parseInt(config.phrase.maxWidth) || (width - 100);
      const startX = parseInt(config.phrase.x) || 50;
      const startY = height - (parseInt(config.phrase.y) || 280);
      const selectedFont = getFont(config.phrase.fontFamily);

      const words = text.split(/\s+/);
      let currentLine = '';
      let yOffset = 0;

      for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testLineWidth = selectedFont.widthOfTextAtSize(testLine, fontSize);

          if (testLineWidth > maxWidth && currentLine) {
              page.drawText(currentLine, { x: startX, y: startY - yOffset - fontSize, size: fontSize, font: selectedFont, color });
              currentLine = word;
              yOffset += (fontSize * 1.3);
          } else {
              currentLine = testLine;
          }
      }
      if (currentLine) {
          page.drawText(currentLine, { x: startX, y: startY - yOffset - fontSize, size: fontSize, font: selectedFont, color });
      }
  }

  return await pdfDoc.save();
};

const processCertificateBatch = async (eventId, adminEmail) => {
  console.log(`[CertificateService] Starting certificate batch for event: ${eventId}`);
  
  try {
    const projectRoot = process.cwd();
    console.log(`[CertificateService] Fetching system settings...`);
    const settings = await prisma.systemSettings.findFirst();
    let brandingLogoBuffer = null;
    if (settings && settings.logoUrl) {
        try {
            const logoPath = path.join(projectRoot, settings.logoUrl.startsWith('/') ? settings.logoUrl.substring(1) : settings.logoUrl);
            console.log(`[CertificateService] Loading branding logo from: ${logoPath}`);
            brandingLogoBuffer = await fs.readFile(logoPath);
        } catch (e) {
            console.warn(`[CertificateService] Could not load branding logo: ${e.message}`);
        }
    }

    console.log(`[CertificateService] Fetching event data for ID: ${eventId}`);
    const parentEvent = await prisma.event.findUnique({
        where: { id: eventId },
        include: { children: true }
    });

    if (!parentEvent) {
        console.error(`[CertificateService] Event ${eventId} not found.`);
        return;
    }

    if (!parentEvent.certificateTemplateConfig) {
        console.error(`[CertificateService] Event ${eventId} has no certificateTemplateConfig.`);
        return;
    }

    const subEventIds = parentEvent.children.map(e => e.id);
    const eventIds = [parentEvent.id, ...subEventIds];

    // 1. BUSCAR TODOS OS INSCRITOS APROVADOS
    console.log(`[CertificateService] Fetching approved enrollments for event ${eventId}`);
    const enrollments = await prisma.enrollment.findMany({
        where: { 
            eventId: parentEvent.id, 
            status: "APPROVED"
        },
        include: { user: true }
    });

    if (enrollments.length === 0) {
        console.log(`[CertificateService] No approved enrollments for event ${eventId}.`);
        return;
    }

    // 2. INICIALIZAÇÃO IMEDIATA DOS LOGS (Para feedback visual no Admin)
    console.log(`[CertificateService] Initializing logs for ${enrollments.length} users...`);
    for (const enrollment of enrollments) {
        const logData = { 
            status: "PROCESSING", 
            details: "Aguardando validação de presença...", 
            createdAt: new Date() 
        };
        const existingLog = await prisma.certificateLog.findFirst({ 
            where: { userId: enrollment.userId, eventId: parentEvent.id } 
        });
        
        if (existingLog) {
            await prisma.certificateLog.update({ where: { id: existingLog.id }, data: logData });
        } else {
            await prisma.certificateLog.create({ 
                data: { ...logData, userId: enrollment.userId, eventId: parentEvent.id } 
            });
        }
    }

    // 3. FILTRAR POR CHECK-IN (Robustamente)
    console.log(`[CertificateService] Processing check-ins for Event IDs:`, eventIds);
    
    // Busca direta na tabela de check-ins para evitar problemas de relação complexa
    const rawCheckins = await prisma.userCheckin.findMany({
        where: { eventId: { in: eventIds } },
        include: { userBadge: { select: { userId: true } } }
    });
    
    console.log(`[CertificateService] Total check-in records found: ${rawCheckins.length}`);
    
    const checkedInUserIds = new Set();
    rawCheckins.forEach(c => {
        if (c.userBadge?.userId) {
            checkedInUserIds.add(c.userBadge.userId);
        }
    });
    
    console.log(`[CertificateService] Unique user IDs with check-in: ${checkedInUserIds.size}`);

    const eligibleEnrollments = enrollments.filter(e => {
        const isEligible = checkedInUserIds.has(e.userId);
        if (!isEligible) {
            console.log(`[CertificateService] User ${e.user.email} (${e.userId}) is INELIGIBLE (No check-in found in these events)`);
        }
        return isEligible;
    });
    const ineligibleEnrollments = enrollments.filter(e => !checkedInUserIds.has(e.userId));

    // Marcar os inelegíveis como ignorados
    for (const enrollment of ineligibleEnrollments) {
        await prisma.certificateLog.updateMany({
            where: { userId: enrollment.userId, eventId: parentEvent.id },
            data: { 
                status: "FAILED", 
                details: "Não elegível: Nenhum check-in registrado neste evento ou sub-eventos.",
                createdAt: new Date()
            }
        });
    }

    if (eligibleEnrollments.length === 0) {
        console.log(`[CertificateService] No checked-in users among approved enrollments for event ${eventId}.`);
        return;
    }

    const eligibleUsers = eligibleEnrollments.map(e => e.user);
    console.log(`[CertificateService] Final count of eligible users to process: ${eligibleUsers.length}`);


    // 2. Carregar template
    let templateImageBuffer = null;
    if (parentEvent.certificateTemplateUrl) {
        const safeTemplatePath = path.join(projectRoot, parentEvent.certificateTemplateUrl.startsWith('/') ? parentEvent.certificateTemplateUrl.substring(1) : parentEvent.certificateTemplateUrl);
        try {
            await fs.access(safeTemplatePath);
            templateImageBuffer = await fs.readFile(safeTemplatePath);
        } catch (e) {
             console.error(`[CertificateService] Template file not found: ${safeTemplatePath}`);
        }
    }

    const config = parentEvent.certificateTemplateConfig;
    const eventsData = await prisma.event.findMany({
        where: { id: { in: eventIds } },
        select: { id: true, startDate: true, endDate: true },
    });
    const eventsMap = new Map(eventsData.map((event) => [event.id, event]));

    // 3. Loop de Processamento
    for (const user of eligibleUsers) {
        try {
            console.log(`[CertificateService] Processing user: ${user.email}`);
            
            const userCheckins = await prisma.userCheckin.findMany({
                where: {
                    eventId: { in: eventIds },
                    userBadge: { userId: user.id },
                },
            });

            let totalMilliseconds = 0;
            const attendedEvents = new Set();
            userCheckins.forEach((checkin) => {
                if (!attendedEvents.has(checkin.eventId)) {
                    const event = eventsMap.get(checkin.eventId);
                    if (event) {
                        const duration = new Date(event.endDate) - new Date(event.startDate);
                        totalMilliseconds += duration;
                        attendedEvents.add(checkin.eventId);
                    }
                }
            });

            const roundedHours = Math.round(totalMilliseconds / (1000 * 60 * 60));
            const totalHours = roundedHours.toString().padStart(2, "0");

            const pdfBytes = await generateCertificatePdf(
                user, config, templateImageBuffer, totalHours, 
                parentEvent.startDate, brandingLogoBuffer, parentEvent.title
            );

            await sendEmail({
                to: user.email,
                subject: `Seu certificado do evento: ${parentEvent.title}`,
                html: `<p>Olá, ${user.name}!</p><p>Agradecemos sua participação no evento "${parentEvent.title}".</p><p>Seu certificado de participação está em anexo.</p><p>Atenciosamente,<br>Equipe Organizadora</p>`,
                attachments: [{
                    filename: `certificado_${user.name.replace(/\s+/g, "_")}.pdf`,
                    content: Buffer.from(pdfBytes),
                    contentType: "application/pdf",
                }],
            });

            await prisma.certificateLog.updateMany({
                where: { userId: user.id, eventId: parentEvent.id },
                data: { status: "SUCCESS", details: `Enviado com ${totalHours}h`, createdAt: new Date() }
            });

        } catch (error) {
            console.error(`[CertificateService] Error for ${user.email}: ${error.message}`);
            await prisma.certificateLog.updateMany({
                where: { userId: user.id, eventId: parentEvent.id },
                data: { status: "FAILED", details: error.message, createdAt: new Date() }
            });
        }
        await delay(1000); 
    }
    
    console.log(`[CertificateService] Finished batch for event ${eventId}`);
    if (adminEmail) {
        await sendEmail({
             to: adminEmail,
             subject: `Envio de certificados concluído: ${parentEvent.title}`,
             html: `<p>O processo de envio de certificados para o evento <strong>${parentEvent.title}</strong> foi concluído.</p>`
        }).catch(err => console.error("[CertificateService] Failed to notify admin:", err.message));
    }
  } catch (error) {
    console.error(`[CertificateService] Critical error processing batch ${eventId}:`, error);
  }
};

const sendSingleCertificate = async (eventId, userId) => {
  console.log(`[CertificateService] Starting single certificate for event: ${eventId}, user: ${userId}`);
  const projectRoot = process.cwd();
  
  const settings = await prisma.systemSettings.findFirst();
  let brandingLogoBuffer = null;
  if (settings && settings.logoUrl) {
      try {
          const logoPath = path.join(projectRoot, settings.logoUrl.startsWith('/') ? settings.logoUrl.substring(1) : settings.logoUrl);
          brandingLogoBuffer = await fs.readFile(logoPath);
      } catch (e) {
          console.warn(`[CertificateService] Could not load branding logo: ${e.message}`);
      }
  }

  const parentEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: { children: true }
  });

  if (!parentEvent) {
      throw new Error("Evento não encontrado.");
  }

  if (!parentEvent.certificateTemplateConfig) {
      throw new Error("Evento não possui um modelo de certificado configurado.");
  }

  const subEventIds = parentEvent.children.map(e => e.id);
  const eventIds = [parentEvent.id, ...subEventIds];

  // 1. BUSCAR A INSCRIÇÃO APROVADA
  const enrollment = await prisma.enrollment.findFirst({
      where: { 
          eventId: parentEvent.id, 
          userId: userId,
          status: "APPROVED"
      },
      include: { user: true }
  });

  if (!enrollment) {
      throw new Error("O participante não possui inscrição aprovada neste evento.");
  }

  const user = enrollment.user;

  // 2. INICIALIZAÇÃO DO LOG DO CERTIFICADO
  const logData = { 
      status: "PROCESSING", 
      details: "Iniciando processamento individual...", 
      createdAt: new Date() 
  };
  const existingLog = await prisma.certificateLog.findFirst({ 
      where: { userId: user.id, eventId: parentEvent.id } 
  });
  
  if (existingLog) {
      await prisma.certificateLog.update({ where: { id: existingLog.id }, data: logData });
  } else {
      await prisma.certificateLog.create({ 
          data: { ...logData, userId: user.id, eventId: parentEvent.id } 
      });
  }

  // 3. VERIFICAR ELEGIBILIDADE (CHECK-IN)
  const rawCheckins = await prisma.userCheckin.findMany({
      where: { 
          eventId: { in: eventIds },
          userBadge: { userId: user.id }
      }
  });

  if (rawCheckins.length === 0) {
      const failDetails = "Não elegível: Nenhum check-in registrado neste evento ou sub-eventos.";
      await prisma.certificateLog.updateMany({
          where: { userId: user.id, eventId: parentEvent.id },
          data: { 
              status: "FAILED", 
              details: failDetails,
              createdAt: new Date()
          }
      });
      throw new Error(failDetails);
  }

  // 4. Carregar template
  let templateImageBuffer = null;
  if (parentEvent.certificateTemplateUrl) {
      const safeTemplatePath = path.join(projectRoot, parentEvent.certificateTemplateUrl.startsWith('/') ? parentEvent.certificateTemplateUrl.substring(1) : parentEvent.certificateTemplateUrl);
      try {
          await fs.access(safeTemplatePath);
          templateImageBuffer = await fs.readFile(safeTemplatePath);
      } catch (e) {
           console.error(`[CertificateService] Template file not found: ${safeTemplatePath}`);
      }
  }

  const config = parentEvent.certificateTemplateConfig;
  const eventsData = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, startDate: true, endDate: true },
  });
  const eventsMap = new Map(eventsData.map((event) => [event.id, event]));

  // 5. Calcular Carga Horária
  let totalMilliseconds = 0;
  const attendedEvents = new Set();
  rawCheckins.forEach((checkin) => {
      if (!attendedEvents.has(checkin.eventId)) {
          const event = eventsMap.get(checkin.eventId);
          if (event) {
              const duration = new Date(event.endDate) - new Date(event.startDate);
              totalMilliseconds += duration;
              attendedEvents.add(checkin.eventId);
          }
      }
  });

  const roundedHours = Math.round(totalMilliseconds / (1000 * 60 * 60));
  const totalHours = roundedHours.toString().padStart(2, "0");

  try {
      const pdfBytes = await generateCertificatePdf(
          user, config, templateImageBuffer, totalHours, 
          parentEvent.startDate, brandingLogoBuffer, parentEvent.title
      );

      await sendEmail({
          to: user.email,
          subject: `Seu certificado do evento: ${parentEvent.title}`,
          html: `<p>Olá, ${user.name}!</p><p>Agradecemos sua participação no evento "${parentEvent.title}".</p><p>Seu certificado de participação está em anexo.</p><p>Atenciosamente,<br>Equipe Organizadora</p>`,
          attachments: [{
              filename: `certificado_${user.name.replace(/\s+/g, "_")}.pdf`,
              content: Buffer.from(pdfBytes),
              contentType: "application/pdf",
          }],
      });

      await prisma.certificateLog.updateMany({
          where: { userId: user.id, eventId: parentEvent.id },
          data: { status: "SUCCESS", details: `Enviado com ${totalHours}h`, createdAt: new Date() }
      });

      return { totalHours };
  } catch (error) {
      console.error(`[CertificateService] Error sending single certificate for ${user.email}: ${error.message}`);
      await prisma.certificateLog.updateMany({
          where: { userId: user.id, eventId: parentEvent.id },
          data: { status: "FAILED", details: error.message, createdAt: new Date() }
      });
      throw error;
  }
};

module.exports = { processCertificateBatch, generateCertificatePdf, sendSingleCertificate };
