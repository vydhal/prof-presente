const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const { generateBadgeHtml } = require("../utils/badgeService");

const isSecure = process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || process.env.SMTP_SECURE === true || String(process.env.SMTP_SECURE).toLowerCase() === "true";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 20000,
});

/**
 * Envia um e-mail com anexo. (Sua função original)
 * @param {string} to - Destinatário do e-mail.
 * @param {string} subject - Assunto do e-mail.
 * @param {string} html - Conteúdo HTML do e-mail.
 * @param {Array} attachments - Array de anexos. Ex: [{ filename: 'certificado.pdf', content: pdfBuffer }]
 */
const sendEmail = async ({ to, subject, html, attachments }) => {
  // Verificação para garantir que o 'from' está configurado
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;

  try {
    console.log(`[EMAIL] Tentando enviar para: ${to} | Assunto: ${subject}`);
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      attachments,
    });
    console.log(`[EMAIL] Sucesso! ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL-ERROR] Falha ao enviar para ${to}:`, error.message);
    if (error.code === 'ESOCKET') {
      console.error(`[EMAIL-ERROR] Dica: Verifique a conexão com ${process.env.SMTP_HOST}`);
    }
    throw error; // Re-throw the error so the caller can handle it
  }
};

// --- FUNÇÕES ADICIONADAS ---

/**
 * Envia um e-mail de confirmação com o CRACHÁ COMPLETO em HTML.
 * @param {object} user
 * @param {object} event
 * @param {object} userBadge
 * @param {Array} awards
 */
const sendEnrollmentConfirmationEmail = async (
  user,
  event,
  userBadge,
  awards
) => {
  if (!user.email) {
    console.error(
      "Tentativa de enviar e-mail para usuário sem endereço:",
      user.id
    );
    return;
  }



  // ... (existing code) ...

  // 1. Identificar o caminho físico do QR code para anexar como CID
  let attachments = [];
  let qrCodeCid = null;
  let userPhotoCid = null; // Novo

  if (userBadge && userBadge.qrCodeUrl) {
    // A URL é algo como "/uploads/qrcodes/user_badge_123.png"
    // Removemos a barra inicial para o path.join funcionar corretamente a partir da raiz
    const relativePath = userBadge.qrCodeUrl.startsWith("/")
      ? userBadge.qrCodeUrl.slice(1)
      : userBadge.qrCodeUrl;

    const qrCodePath = path.join(process.cwd(), relativePath);
    qrCodeCid = `qrcode_${userBadge.badgeCode}`;

    if (fs.existsSync(qrCodePath)) {
      attachments.push({
        filename: "qrcode.png",
        path: qrCodePath,
        cid: qrCodeCid,
      });
    }
  }

  // Lógica para anexar a foto do usuário (se for local)
  if (user.photoUrl && user.photoUrl.startsWith("/uploads")) {
    const relativePath = user.photoUrl.startsWith("/")
      ? user.photoUrl.slice(1)
      : user.photoUrl;

    const photoPath = path.join(process.cwd(), relativePath);

    if (fs.existsSync(photoPath)) {
      userPhotoCid = `userphoto_${user.id}`;
      attachments.push({
        filename: path.basename(photoPath),
        path: photoPath,
        cid: userPhotoCid
      });
    }
  }

  // Lógica para anexar o LOGO do sistema (local)
  const logoPath = path.join(__dirname, "../assets/logo.png");
  console.log(`[EMAIL-DEBUG] Tentando anexar logo de: ${logoPath}`);

  let logoCid = null;
  if (fs.existsSync(logoPath)) {
    console.log("[EMAIL-DEBUG] Logo encontrado via fs.existsSync");
    logoCid = "logo_prof_presente";
    attachments.push({
      filename: "logo.png",
      path: logoPath,
      cid: logoCid
    });
  } else {
    console.warn(`[EMAIL-DEBUG] Logo NÃO encontrado no caminho: ${logoPath}`);
  }

  // 2. Gera o HTML do crachá dinamicamente, passando os CIDs
  const badgeHtml = generateBadgeHtml(user, userBadge, awards, {
    qrCodeCid,
    userPhotoCid,
    logoCid // Novo CID do logo
  });

  console.log(`[EMAIL-DEBUG] Attachments preparados: ${attachments.length} arquivos.`);
  attachments.forEach(att => console.log(` - ${att.filename} (${att.cid}) -> ${att.path}`));

  const subject = `Crachá e Confirmação de Inscrição: ${event.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; text-align: center; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333;">Olá, ${user.name}!</h2>
        <p style="color: #555;">Sua inscrição no evento <strong>${event.title}</strong> foi confirmada com sucesso.</p>
        <p style="color: #555;">Abaixo está o seu crachá de acesso. Ele será necessário para o check-in no dia do evento.</p>
        
        <div style="margin: 20px auto; display: inline-block;">
          ${badgeHtml}
        </div>

        <p style="color: #555;">Recomendamos salvar este e-mail para fácil acesso.</p>
        <p style="color: #555; margin-top: 30px;">Atenciosamente,<br>Equipe Prof Presente</p>
      </div>
    </div>
  `;

  await sendEmail({ to: user.email, subject, html, attachments });
};

/**
 * Envia um e-mail de cancelamento de inscrição usando a função genérica sendEmail.
 * @param {object} user - O objeto do usuário (precisa de name, email).
 * @param {object} event - O objeto do evento (precisa de title).
 */
const sendEnrollmentCancellationEmail = async (user, event) => {
  if (!user.email) {
    console.error(
      "Tentativa de enviar e-mail para usuário sem endereço:",
      user.id
    );
    return;
  }

  const subject = `Inscrição Cancelada: ${event.title}`;
  const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Olá, ${user.name},</h2>
          <p>Confirmamos o cancelamento da sua inscrição no evento <strong>${event.title}</strong>.</p>
          <p>Se você não solicitou este cancelamento, por favor, entre em contato com o suporte.</p>
          <p>Esperamos te ver em eventos futuros!</p>
          <p>Atenciosamente,<br>Equipe Prof Presente</p>
      </div>
  `;

  await sendEmail({ to: user.email, subject, html });
};

module.exports = {
  sendEmail, // Sua função original
  sendEnrollmentConfirmationEmail, // Nova função
  sendEnrollmentCancellationEmail, // Nova função
};
