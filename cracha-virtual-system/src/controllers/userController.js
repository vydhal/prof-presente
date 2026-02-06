const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const { prisma } = require("../config/database");
const axios = require("axios");

// Validações para atualização de usuário
const updateUserValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Nome deve ter entre 2 e 255 caracteres"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Email inválido"),
  body("cpf")
    .optional()
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
    .withMessage("CPF deve estar no formato XXX.XXX.XXX-XX"),
  body("birthDate")
    .optional()
    .isISO8601()
    .withMessage("Data de nascimento inválida"),
];

// Função auxiliar para chamar o serviço facial (evita repetição)
const callFacialServiceIndex = async (userId, photoUrl) => {
  // Só tenta indexar se tivermos a URL do serviço e uma foto
  if (!process.env.FACIAL_SERVICE_URL || !photoUrl) {
    console.warn(
      `[Facial Service] Indexação pulada para ${userId}. URL do serviço ou foto ausente.`
    );
    return null;
  }
  try {
    console.log(
      `[Facial Service] Iniciando indexação para usuário ${userId}...`
    );
    const response = await axios.post(
      `${process.env.FACIAL_SERVICE_URL}/index-face`,
      {
        userId: userId,
        photoUrl: photoUrl,
      }
    );
    console.log(`[Facial Service] Indexação bem-sucedida para ${userId}.`);
    return response.data.descriptor; // Retorna o descritor (array de números)
  } catch (error) {
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com status fora de 2xx
      console.error(
        `[Facial Service] Erro ${error.response.status} ao indexar face para ${userId}:`,
        error.response.data
      );
    } else if (error.request) {
      // A requisição foi feita mas nenhuma resposta foi recebida (pode ser timeout ou socket hang up)
      console.error(
        `[Facial Service] Nenhuma resposta recebida do serviço facial para ${userId}:`,
        error.message
      );
    } else {
      // Erro ao configurar a requisição
      console.error(
        `[Facial Service] Erro ao configurar chamada para indexar face ${userId}:`,
        error.message
      );
    }
    return null; // Retorna null em caso de erro
  }
};

// Listar todos os usuários (apenas admin)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Obter usuário por ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
        hasConsentFacialRecognition: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            userAwards: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Erro ao obter usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Atualizar usuário
const updateUser = async (req, res) => {
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
    const { name, email, cpf, birthDate, phone, address, password } = req.body;

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    // Verificar se o email já está em uso por outro usuário
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(409).json({
          error: "Email já está em uso",
        });
      }
    }

    // Verificar se o CPF já está em uso por outro usuário
    if (cpf && cpf !== existingUser.cpf) {
      const cpfExists = await prisma.user.findUnique({
        where: { cpf },
      });

      if (cpfExists) {
        return res.status(409).json({
          error: "CPF já está em uso",
        });
      }
    }

    // Preparar dados para atualização
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (cpf) updateData.cpf = cpf;
    if (birthDate) updateData.birthDate = new Date(birthDate);
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    // Hash da nova senha se fornecida
    if (password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
        updatedAt: true,
      },
    });

    res.json({
      message: "Usuário atualizado com sucesso",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Deletar usuário
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    // Deletar usuário (cascade irá deletar relacionamentos)
    await prisma.user.delete({
      where: { id },
    });

    res.json({
      message: "Usuário deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Atualizar foto do perfil
const updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.params.id; // <<-- CORRIGIDO: Usar req.params.id
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo de foto enviado." });
    }
    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    const userBeforeUpdate = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, hasConsentFacialRecognition: true }, // Seleciona só o necessário
    });

    if (!userBeforeUpdate) {
      // Se o usuário não existe, pode ser necessário deletar a foto órfã (lógica futura)
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Atualiza a URL da foto no banco
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { photoUrl },
      // Seleciona os dados necessários para a resposta e lógica facial
      select: {
        id: true,
        name: true,
        email: true,
        photoUrl: true,
        role: true,
        updatedAt: true,
        hasConsentFacialRecognition: true,
      },
    });

    // --- LÓGICA FACIAL ---
    if (updatedUser.hasConsentFacialRecognition) {
      console.log(`Usuário ${userId} consentiu, (re)indexando nova foto...`);
      const descriptor = await callFacialServiceIndex(
        userId,
        updatedUser.photoUrl
      );
      if (descriptor) {
        await prisma.user.update({
          where: { id: userId },
          data: { faceDescriptor: descriptor },
        });
        console.log(`Descritor facial atualizado para ${userId}`);
      } else {
        console.warn(
          `Falha ao gerar descritor para a nova foto do usuário ${userId}.`
        );
        // Considerar limpar o descritor antigo se a nova indexação falhar?
        // await prisma.user.update({ where: { id: userId }, data: { faceDescriptor: null } });
      }
    }
    // --- FIM LÓGICA FACIAL ---

    // Remove dados sensíveis (senha já não estava selecionada)
    const { faceDescriptor, ...userForResponse } = updatedUser;

    res.json({
      message: "Foto do perfil atualizada com sucesso",
      user: userForResponse, // Retorna dados atualizados sem o descritor
    });
  } catch (error) {
    console.error("Erro ao atualizar foto do perfil:", error);
    // Tentar deletar a foto salva se a atualização no DB falhar? (lógica futura)
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Atualizar role do usuário (apenas admin)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validar role
    const validRoles = [
      "ADMIN",
      "GESTOR_ESCOLA",
      "ORGANIZER",
      "CHECKIN_COORDINATOR",
      "TEACHER",
      "USER",
      "SPEAKER",
    ];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error: "Role inválido. Valores permitidos: " + validRoles.join(", "),
      });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    // Atualizar role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({
      message: "Role do usuário atualizado com sucesso",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erro ao atualizar role do usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Redefinir senha do usuário (apenas admin)
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: "Nova senha deve ter pelo menos 6 caracteres",
      });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    // Hash da nova senha
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({
      message: "Senha redefinida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user.id; // ID do usuário logado

    await prisma.user.update({
      where: { id: userId },
      data: { hasCompletedOnboarding: true },
    });

    res.status(200).json({ message: "Onboarding concluído com sucesso." });
  } catch (error) {
    console.error("Erro ao concluir onboarding:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

// --- NOVA FUNÇÃO: ATUALIZAR CONSENTIMENTO FACIAL ---
const updateFacialConsent = async (req, res) => {
  // Usamos um try/catch geral para a lógica principal síncrona
  try {
    const userId = req.user.id;
    const { consent } = req.body;

    if (typeof consent !== "boolean") {
      return res
        .status(400)
        .json({ error: 'O campo "consent" (boolean) é obrigatório.' });
    }

    // 1. Atualiza o status do consentimento IMEDIATAMENTE
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { hasConsentFacialRecognition: consent },
      select: {
        id: true,
        photoUrl: true,
        hasConsentFacialRecognition: true,
        faceDescriptor: true,
      },
    });

    let message = `Consentimento facial ${consent ? "concedido" : "revogado"}.`;

    // 2. Decide se a indexação/limpeza precisa ser feita EM SEGUNDO PLANO
    let backgroundTaskNeeded = false;
    if (consent && updatedUser.photoUrl && !updatedUser.faceDescriptor) {
      console.log(`[Async Task] Indexação facial necessária para ${userId}.`);
      backgroundTaskNeeded = true;
      message += " Processamento facial iniciado em segundo plano.";
    } else if (!consent && updatedUser.faceDescriptor) {
      console.log(
        `[Async Task] Remoção de descritor facial necessária para ${userId}.`
      );
      backgroundTaskNeeded = true;
      message += " Remoção de dados faciais iniciada em segundo plano.";
    } else if (consent && !updatedUser.photoUrl) {
      message +=
        " Adicione uma foto de perfil para habilitar o reconhecimento.";
    } else if (consent && updatedUser.faceDescriptor) {
      message += " Reconhecimento facial já estava ativo e indexado.";
    }

    // 3. ENVIA A RESPOSTA PARA O FRONTEND IMEDIATAMENTE!
    res.status(200).json({
      message,
      hasConsentFacialRecognition: updatedUser.hasConsentFacialRecognition,
    });

    // 4. EXECUTA A TAREFA EM SEGUNDO PLANO (SE NECESSÁRIO)
    // Usamos uma função auto-executável (IIFE) com async para não bloquear
    if (backgroundTaskNeeded) {
      (async () => {
        if (consent) {
          // Tarefa de Indexação
          console.log(
            `[Background Index] Iniciando indexação para ${userId}...`
          );
          const descriptor = await callFacialServiceIndex(
            userId,
            updatedUser.photoUrl
          );
          if (descriptor) {
            try {
              await prisma.user.update({
                where: { id: userId },
                data: { faceDescriptor: descriptor },
              });
              console.log(
                `[Background Index] Descritor salvo com sucesso para ${userId}.`
              );
            } catch (prismaError) {
              console.error(
                `[Background Index] ERRO ao salvar descritor para ${userId}:`,
                prismaError
              );
              // Logar o erro é importante, mas não podemos enviar resposta ao frontend aqui
            }
          } else {
            console.warn(
              `[Background Index] Falha ao gerar descritor para ${userId}.`
            );
          }
        } else {
          // Tarefa de Limpeza
          console.log(
            `[Background Clear] Limpando descritor para ${userId}...`
          );
          try {
            await prisma.user.update({
              where: { id: userId },
              data: { faceDescriptor: null },
            });
            console.log(
              `[Background Clear] Descritor limpo com sucesso para ${userId}.`
            );
            // Chamar API Python/AWS para remover face da coleção seria aqui
          } catch (prismaError) {
            console.error(
              `[Background Clear] ERRO ao limpar descritor para ${userId}:`,
              prismaError
            );
          }
        }
      })(); // Chama a função imediatamente
    }
  } catch (error) {
    // Catch para erros na parte síncrona (update inicial do consentimento)
    console.error("Erro (síncrono) ao atualizar consentimento facial:", error);
    res
      .status(500)
      .json({ error: "Erro interno do servidor ao atualizar consentimento." });
  }
};

// --- NOVA FUNÇÃO: LISTAR HISTÓRICO DE EVENTOS DO USUÁRIO ---
const getUserEnrollments = async (req, res) => {
  try {
    const { id } = req.params;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedHistory = enrollments.map(enrollment => ({
      eventId: enrollment.event.id,
      eventTitle: enrollment.event.title,
      eventDate: enrollment.event.startDate,
      location: enrollment.event.location,
      status: enrollment.status,
      enrolledAt: enrollment.createdAt,
      checkInTime: enrollment.checkInTime,
      certificateUrl: enrollment.certificateUrl // Se tiver certificado gerado
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error("Erro ao buscar histórico do usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfilePhoto,
  updateUserValidation,
  updateUserRole,
  resetUserPassword,
  completeOnboarding,
  updateFacialConsent,
  getUserEnrollments, // Exportar nova função
};
