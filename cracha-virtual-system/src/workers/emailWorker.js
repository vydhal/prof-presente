const { consumeQueue } = require('../services/queueService');
const { prisma } = require("../config/database");
const sharp = require("sharp");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fs = require("fs/promises");
const path = require("path");
const { sendEmail } = require("../utils/email");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Função auxiliar para gerar PDF (Copiada do eventController)
async function generateCertificatePdf(
  user,
  config,
  templateImageBuffer,
  totalHours
) {
  const nameSvg = `<svg width="800" height="100"><text x="0" y="${
    config.name.fontSize || 24
  }" font-family="sans-serif" font-size="${config.name.fontSize || 24}" fill="${
    config.name.color || "#000000"
  }">${user.name}</text></svg>`;
  const hoursText = `${totalHours} h.`;

  const hoursSvg = `<svg width="400" height="100"><text x="0" y="${
    config.hours.fontSize || 18
  }" font-family="sans-serif" font-size="${
    config.hours.fontSize || 18
  }" fill="${config.hours.color || "#333333"}">${hoursText}</text></svg>`;

  const finalCertificateBuffer = await sharp(templateImageBuffer)
    .composite([
      { input: Buffer.from(nameSvg), top: config.name.y, left: config.name.x },
      {
        input: Buffer.from(hoursSvg),
        top: config.hours.y,
        left: config.hours.x,
      },
    ])
    .jpeg()
    .toBuffer();

  const pdfDoc = await PDFDocument.create();
  const certificateImage = await pdfDoc.embedJpg(finalCertificateBuffer);
  const page = pdfDoc.addPage([
    certificateImage.width,
    certificateImage.height,
  ]);
  page.drawImage(certificateImage, {
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
  });
  return await pdfDoc.save();
}

const processCertificateBatch = async (eventId, adminEmail) => {
  console.log(`[Worker] Starting certificate batch for event ${eventId}`);
  
  try {
    // 1. Validar configs (Lógica adaptada do controller)
    const parentEvent = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            subEvents: true,
        }
    });

    if (!parentEvent || !parentEvent.certificateTemplateUrl || !parentEvent.certificateTemplateConfig) {
        console.error(`[Worker] Event ${eventId} invalid configuration.`);
        return;
    }

    // Identificar sub-eventos
    const subEventIds = parentEvent.subEvents.map(e => e.id);
    const eventIds = [parentEvent.id, ...subEventIds];

    // 2. Buscar usuários elegíveis (Inscritos e Aprovados)
    // Nota: O controller buscava checkins para calcular horas, mas a lista de envio é baseada em quem tem checkin?
    // O controller original iterava sobre `eligibleUsers` que eram baseados em enrollments APPROVED.
    // Vamos replicar a buscar.
    
    // Enrollments no evento PAI
    const enrollments = await prisma.enrollment.findMany({
        where: { eventId: parentEvent.id, status: "APPROVED" },
        include: { user: true }
    });
    
    const eligibleUsers = enrollments.map(e => e.user);

    if (eligibleUsers.length === 0) {
        console.log(`[Worker] No eligible users for event ${eventId}`);
        return;
    }

    // Carregar template
    const templatePath = path.resolve(
        __dirname,
        "../../", // Subir para raiz do projeto (src/../) -> ajustando path conforme estrutura
        // O path salvo no banco começa com /uploads, então removemos a barra inicial se necessário ou usamos path.join
        // O controller usava: path.join(__dirname, "../../", parentEvent.certificateTemplateUrl)
        // Se certificateTemplateUrl já tem / no inicio (ex: /uploads/...), path.join resolve corretamente relativo à raiz?
        // O controller original estava em src/controllers. __dirname é src/controllers.
        // ../../ volta para raiz do projeto.
        // O banco salva "/uploads/...".
        // path.join("root", "/uploads/...") no windows pode dar problema se não tratar.
        // Vamos assumir que funciona como no controller original:
        // const templatePath = path.join(__dirname, "../../", parentEvent.certificateTemplateUrl);
        parentEvent.certificateTemplateUrl.startsWith('/') 
            ? parentEvent.certificateTemplateUrl.substring(1) 
            : parentEvent.certificateTemplateUrl
    );

    // Ajuste seguro de path
    const projectRoot = path.resolve(__dirname, "../../");
    const safeTemplatePath = path.join(projectRoot, parentEvent.certificateTemplateUrl.startsWith('/') ? parentEvent.certificateTemplateUrl.substring(1) : parentEvent.certificateTemplateUrl);

    // Verificação de segurança simples
    try {
        await fs.access(safeTemplatePath);
    } catch (e) {
         console.error(`[Worker] Template file not found: ${safeTemplatePath}`);
         return;
    }

    const templateImageBuffer = await fs.readFile(safeTemplatePath);
    const config = parentEvent.certificateTemplateConfig;

    // Cache de eventos para cálculo de horas
    const eventsData = await prisma.event.findMany({
        where: { id: { in: eventIds } },
        select: { id: true, startDate: true, endDate: true },
    });
    const eventsMap = new Map(eventsData.map((event) => [event.id, event]));

    console.log(`[Worker] Processing ${eligibleUsers.length} users for event ${eventId}`);

    for (const user of eligibleUsers) {
        try {
            // Calcular horas
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

            if (totalMilliseconds === 0) {
                 // Pula usuário sem horas, mas talvez devesse logar falha?
                 // O controller original lançava erro "Participação não resultou em horas".
                 throw new Error("Participação não resultou em horas (duração 0).");
            }

            const roundedHours = Math.round(totalMilliseconds / (1000 * 60 * 60));
            const totalHours = roundedHours.toString().padStart(2, "0");

            // Gerar PDF
            const pdfBytes = await generateCertificatePdf(
                user,
                config,
                templateImageBuffer,
                totalHours
            );

            // Enviar Email
            await sendEmail({
                to: user.email,
                subject: `Seu certificado do evento: ${parentEvent.title}`,
                html: `
                  <p>Olá, ${user.name}!</p>
                  <p>Agradecemos sua participação no evento "${parentEvent.title}".</p>
                  <p>Seu certificado de participação, com um total de ${totalHours} h. , está em anexo.</p>
                  <br>
                  <p>Atenciosamente,</p>
                  <p>Equipe Organizadora</p>
                `,
                attachments: [
                    {
                        filename: `certificado_${user.name.replace(/\s+/g, "_")}.pdf`,
                        content: Buffer.from(pdfBytes),
                        contentType: "application/pdf",
                    },
                ],
            });

            // Log Sucesso
            await prisma.certificateLog.upsert({
                where: { userId_eventId_unique_constraint: { userId: user.id, eventId: parentEvent.id } }, // Ajuste se não houver unique constraint, usar findFirst/update logic
                update: { status: "SUCCESS", details: null, createdAt: new Date() },
                create: { status: "SUCCESS", details: null, userId: user.id, eventId: parentEvent.id, createdAt: new Date() }
            }).catch(async () => {
                 // Fallback para lógica manual se upsert falhar por falta de indice unico (o controller original usava findFirst + update/create)
                const existingLog = await prisma.certificateLog.findFirst({ where: { userId: user.id, eventId: parentEvent.id } });
                if(existingLog) {
                    await prisma.certificateLog.update({ where: { id: existingLog.id }, data: { status: "SUCCESS", details: null, createdAt: new Date() } });
                } else {
                    await prisma.certificateLog.create({ data: { status: "SUCCESS", details: null, userId: user.id, eventId: parentEvent.id, createdAt: new Date() } });
                }
            });

        } catch (error) {
            console.error(`[Worker] Failed for user ${user.email}: ${error.message}`);
            // Log Falha
             const failData = { status: "FAILED", details: error.message, createdAt: new Date() };
             const existingLog = await prisma.certificateLog.findFirst({ where: { userId: user.id, eventId: parentEvent.id } });
             if(existingLog) {
                  await prisma.certificateLog.update({ where: { id: existingLog.id }, data: failData });
             } else {
                  await prisma.certificateLog.create({ data: { ...failData, userId: user.id, eventId: parentEvent.id } });
             }
        }
        
        // Throttling para não estourar rate limit de email (opcional)
        await delay(1000); 
    }
    
    console.log(`[Worker] Finished batch for event ${eventId}`);
    
    // Opcional: Enviar email para admin avisando do término
    if(adminEmail) {
        await sendEmail({
             to: adminEmail,
             subject: `Envio de certificados concluído: ${parentEvent.title}`,
             html: `<p>O processo de envio de certificados para o evento <strong>${parentEvent.title}</strong> foi concluído.</p>`
        });
    }

  } catch (error) {
    console.error(`[Worker] Critical error processing batch ${eventId}:`, error);
  }
};

const startEmailWorker = async () => {
    console.log('Starting Email Worker...');
    
    await consumeQueue('email_queue', async (data) => {
        const { type, payload } = data;
        
        if (type === 'SEND_CERTIFICATES') {
             await processCertificateBatch(payload.eventId, payload.adminEmail);
        }
    });
};

module.exports = { startEmailWorker };
