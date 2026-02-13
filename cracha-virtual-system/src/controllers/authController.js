const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const { prisma } = require("../config/database");
const { generateToken } = require("../utils/jwt");
const { generateQRCode } = require("../utils/qrcode");
const { sendEmail } = require("../utils/email"); // Import sendEmail
const jwt = require("jsonwebtoken"); // Import jsonwebtoken for reset token

// --- NOVO: Copie esta função para cá ou importe-a de um arquivo de utils ---
const generateBadgeCode = (userName) => {
  const names = userName.trim().split(" ");
  const firstName = names[0].toUpperCase();
  const lastName =
    names.length > 1 ? names[names.length - 1].toUpperCase() : "";
  const randomNumbers = Math.floor(1000 + Math.random() * 9000);

  if (lastName) {
    return `${firstName}-${lastName}-${randomNumbers}`;
  }
  return `${firstName}-${randomNumbers}`;
};

// Validações para registro
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Nome deve ter entre 2 e 255 caracteres"),
  body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Senha deve ter pelo menos 6 caracteres"),
  body("birthDate").isISO8601().withMessage("Data de nascimento inválida"),
  body("cpf")
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
    .withMessage("CPF deve estar no formato XXX.XXX.XXX-XX"),
  body("contractType")
    .optional()
    .isIn(["EFETIVO", "PRESTADOR", "ESTUDANTE", "EXTERNO"])
    .withMessage("Tipo de vínculo inválido"),
  body("workShifts")
    .optional()
    .isArray()
    .withMessage("Turno deve ser um array."),
  body("workShifts.*")
    .optional()
    .isIn(["MANHA", "TARDE", "NOITE", "INTEGRAL"])
    .withMessage("Turno inválido."),
  body("teachingSegments")
    .optional()
    .isArray()
    .withMessage("Segmento de ensino deve ser um array."),
  body("teachingSegments.*")
    .optional()
    .isIn(["INFANTIL", "FUNDAMENTAL1", "FUNDAMENTAL2", "EJA", "ADMINISTRATIVO", "SUPERIOR"])
    .withMessage("Segmento de ensino inválido."),
];

// Validações para login
const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("password").notEmpty().withMessage("Senha é obrigatória"),
];

// Registrar usuário
const register = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors.array(),
      });
    }

    const {
      name,
      email,
      password,
      cpf,
      birthDate,
      phone,
      address,
      workplaceIds,
      neighborhood, // NOVO
      professionName, // Pode vir como nome
      workShifts, // NOVO
      contractType, // NOVO
      teachingSegments, // NOVO
    } = req.body;

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Email já está em uso",
      });
    }

    // Verificar se o CPF já existe (se fornecido)
    if (cpf) {
      const existingCpf = await prisma.user.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        return res.status(409).json({
          error: "CPF já está em uso",
        });
      }
    }

    // --- NOVA LÓGICA: Geração do código do crachá ---
    let badgeCode;
    let isUnique = false;
    while (!isUnique) {
      badgeCode = generateBadgeCode(name);
      const existingBadge = await prisma.userBadge.findUnique({
        where: { badgeCode },
      });
      if (!existingBadge) isUnique = true;
    }

    // LÓGICA PARA MÚLTIPLAS UNIDADES
    let workplacesConnect = undefined;
    if (
      workplaceIds &&
      Array.isArray(workplaceIds) &&
      workplaceIds.length > 0
    ) {
      workplacesConnect = workplaceIds.map((id) => ({ id }));
    }

    // LÓGICA DE PROFISSÃO
    let professionConnectOrCreate = undefined;
    if (professionName) {
      professionConnectOrCreate = {
        where: { name: professionName.trim() },
        create: { name: professionName.trim() },
      };
    }

    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const result = await prisma.$transaction(async (tx) => {
      // 5. Criação do usuário (usando sua lógica original, agora dentro da transação)
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          cpf: cpf ? cpf.replace(/\D/g, "") : null,
          birthDate: new Date(birthDate),
          phone: phone || null,
          address: address || null,
          neighborhood: neighborhood || null,
          workShifts: Array.isArray(workShifts) ? workShifts.join(",") : workShifts,
          contractType: contractType || null,
          teachingSegments: Array.isArray(teachingSegments) ? teachingSegments.join(",") : teachingSegments,
          photoUrl: null,
          profession: professionName
            ? { connectOrCreate: professionConnectOrCreate }
            : undefined,
          workplaces: workplacesConnect
            ? { connect: workplacesConnect }
            : undefined,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          photoUrl: true,
        },
      });

      // 6. Geração do QR Code e criação do crachá universal (nova lógica)
      const qrData = JSON.stringify({
        userId: newUser.id,
        badgeCode,
        badgeType: "user",
      });
      const qrCodeFilename = `user_badge_${newUser.id}`;
      await generateQRCode(qrData, qrCodeFilename);
      const qrCodeUrl = `/uploads/qrcodes/${qrCodeFilename}.png`;

      const badgeImageUrl = `/api/badges/${newUser.id}/image`;

      await tx.userBadge.create({
        data: {
          userId: newUser.id,
          badgeCode,
          qrCodeUrl,
          badgeImageUrl,
        },
      });

      return newUser; // Retorna o usuário criado para a resposta final
    });

    // --- NOVO: Gerar token para Auto-Login ---
    const token = generateToken({ userId: result.id });

    // Retornar dados do usuário (sem senha)
    // O prisma select já filtrou a senha, mas garantindo:
    const { password: _, ...userResponse } = result;

    res.status(201).json({
      message: "Usuário registrado com sucesso",
      user: userResponse,
      token, // <-- Retorna o token
    });
  } catch (error) {
    // 7. Seu tratamento de erro original (mantido)
    if (error.code === "P2002") {
      const field = error.meta.target.join(", ");
      return res
        .status(409)
        .json({ error: `Conflito: O campo '${field}' já está em uso.` });
    }
    console.error("Erro no registro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Login do usuário
const login = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "Credenciais inválidas. Verifique seu email e senha.",
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Credenciais inválidas. Verifique seu email e senha.",
      });
    }

    // Gerar token JWT
    const token = generateToken({ userId: user.id });

    // Retornar dados do usuário (sem senha)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login realizado com sucesso",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Obter perfil do usuário logado
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        birthDate: true,
        phone: true,
        address: true,
        photoUrl: true,
        role: true,
        hasCompletedOnboarding: true,
        hasConsentFacialRecognition: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Erro ao obter perfil:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Solicitar redefinição de senha
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Por segurança, não informamos que o usuário não existe, apenas retornamos sucesso
      return res.json({ message: "Se este email estiver cadastrado, você receberá um link de redefinição." });
    }

    // Gerar token de redefinição (válido por 1 hora)
    const token = jwt.sign(
      { userId: user.id, purpose: "reset_password" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetLink = `${process.env.FRONTEND_URL || "https://eduagenda.simplisoft.com.br"}/reset-password?token=${token}`;

    const subject = "Redefinição de Senha - Prof Presente";
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Olá, ${user.name}!</h2>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 20px 0;">
             <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir Senha</a>
        </div>
        <p>Se nada acontecer ao clicar no botão, copie e cole o link no seu navegador:</p>
        <p>${resetLink}</p>
        <p>Este link é válido por 1 hora.</p>
        <p>Se você não solicitou isso, pode ignorar este email.</p>
        <p>Atenciosamente,<br>Equipe Prof Presente</p>
      </div>
    `;

    await sendEmail({ to: user.email, subject, html });

    res.json({ message: "Se este email estiver cadastrado, você receberá um link de redefinição." });
  } catch (error) {
    console.error("Erro no forgotPassword:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Redefinir senha
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token e nova senha são obrigatórios" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.purpose !== "reset_password") {
        return res.status(403).json({ error: "Token inválido para redefinição de senha" });
      }
    } catch (err) {
      return res.status(403).json({ error: "Token inválido ou expirado" });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Senha redefinida com sucesso. Você já pode fazer login." });

  } catch (error) {
    console.error("Erro no resetPassword:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};


module.exports = {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  registerValidation,
  loginValidation,
};
