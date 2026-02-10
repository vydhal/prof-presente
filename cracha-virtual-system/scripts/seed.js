const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const fs = require("fs").promises;
const path = require("path");

const prisma = new PrismaClient();

const getDynamicDate = (daysOffset, isPast = false) => {
  const date = new Date();
  if (isPast) {
    date.setDate(date.getDate() - daysOffset);
  } else {
    date.setDate(date.getDate() + daysOffset);
  }
  return date;
};

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  try {
    // Limpar dados existentes (em ordem devido às dependências)
    console.log("🧹 Limpando dados existentes...");

    await prisma.courseEvaluation.deleteMany();
    await prisma.userCheckin.deleteMany();
    await prisma.userAward.deleteMany();
    await prisma.eventStaff.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.award.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    // Criar usuários
    console.log("👥 Criando usuários...");

    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = await prisma.user.create({
      data: {
        name: "Administrador Sistema",
        email: "admin@cracha.com",
        password: hashedPassword,
        role: "ADMIN",
        birthDate: new Date("1985-01-15"),
        cpf: "123.456.789-00",
        phone: "(11) 99999-0000",
        address: "Rua Admin, 123, São Paulo, SP",
      },
    });

    const users = [];
    const userNames = [
      "João Silva",
      "Maria Santos",
      "Carlos Oliveira",
      "Ana Costa",
      "Pedro Ferreira",
      "Lucia Rodrigues",
      "Rafael Lima",
      "Fernanda Alves",
      "Bruno Pereira",
      "Camila Souza",
    ];

    for (let i = 0; i < userNames.length; i++) {
      const user = await prisma.user.create({
        data: {
          name: userNames[i],
          email: `user${i + 1}@cracha.com`,
          password: hashedPassword,
          role: "TEACHER", // Role válida
          birthDate: new Date(
            1990 + Math.floor(Math.random() * 20),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
          ),
          cpf: `${String(i + 1).padStart(3, "0")}.${String(i + 1).padStart(
            3,
            "0"
          )}.${String(i + 1).padStart(3, "0")}-${String(i + 1).padStart(
            2,
            "0"
          )}`,
          phone: `(11) 9999${String(i + 1).padStart(4, "0")}`,
          address: `Rua ${userNames[i].split(" ")[0]}, ${(i + 1) * 10
            }, São Paulo, SP`,
        },
      });
      users.push(user);
    }

    console.log(`✅ Criados ${users.length + 1} usuários`);

    // Criar eventos
    console.log("📅 Criando eventos...");

    const eventData = [
      {
        title: "Conferência de Tecnologia (Evento Passado)",
        description:
          "O maior evento de tecnologia do ano com palestrantes renomados e workshops práticos.",
        startDate: getDynamicDate(30, true),
        endDate: getDynamicDate(28, true),
        location: "Centro de Convenções Anhembi, São Paulo",
        maxAttendees: 500,
      },
      {
        title: "Workshop de React e Node.js (Em Andamento)",
        description:
          "Workshop intensivo de desenvolvimento full-stack com React no frontend e Node.js no backend.",
        startDate: getDynamicDate(1, true),
        endDate: getDynamicDate(1, false),
        location: "Laboratório de Informática - FIAP",
        maxAttendees: 50,
      },
      {
        title: "Seminário de Inteligência Artificial (Próximo)",
        description:
          "Explore o futuro da IA com especialistas da área. Discussões sobre machine learning e deep learning.",
        startDate: getDynamicDate(15, false),
        endDate: getDynamicDate(15, false),
        location: "Auditório da USP, São Paulo",
        maxAttendees: 200,
      },
      {
        title: "Curso de DevOps e Cloud Computing (Futuro)",
        description:
          "Curso completo sobre DevOps, containerização com Docker, Kubernetes e deploy em nuvem AWS.",
        startDate: getDynamicDate(45, false),
        endDate: getDynamicDate(49, false),
        location: "Centro de Treinamento TechLab",
        maxAttendees: 30,
      },
      {
        title: "Hackathon Inovação Digital (Futuro Distante)",
        description:
          "48 horas de pura criatividade e código. Desenvolva soluções inovadoras para problemas reais.",
        startDate: getDynamicDate(90, false),
        endDate: getDynamicDate(92, false),
        location: "Hub de Inovação - Vila Madalena",
        maxAttendees: 100,
      },
    ];

    const eventPromises = eventData.map((data) =>
      prisma.event.create({ data })
    );
    const events = await Promise.all(eventPromises);
    console.log(`✅ Criados ${events.length} eventos`);

    // Criar premiações
    console.log("🏆 Criando premiações...");

    const awards = [];
    const awardData = [
      {
        name: "Primeiro Check-in",
        description: "Parabéns pelo seu primeiro check-in no sistema!",
        criteria: "Realizar o primeiro check-in em qualquer evento",
        imageUrl: "/insignias/primeiro-checkin.svg",
      },
      {
        name: "Participante Assíduo",
        description: "Você é um participante dedicado!",
        criteria: "Realizar check-in em 3 eventos diferentes",
        imageUrl: "/insignias/participante-assiduo.svg",
      },
      {
        name: "Frequentador VIP",
        description: "Sua presença é sempre marcante!",
        criteria: "Realizar 5 check-ins ou mais",
        imageUrl: "/insignias/frequentador-vip.svg",
      },
      {
        name: "Expert em Tecnologia",
        description: "Especialista em eventos de tecnologia",
        criteria: "Participar de 5 eventos de tecnologia",
        imageUrl: "/insignias/expert-tecnologia.svg",
      },
      {
        name: "Networking Master",
        description: "Mestre em networking e conexões",
        criteria: "Realizar 10 check-ins ou mais",
        imageUrl: "/insignias/networking-master.svg",
      },
    ];

    for (const awardInfo of awardData) {
      const award = await prisma.award.create({
        data: awardInfo,
      });
      awards.push(award);
    }
    console.log(`✅ Criadas ${awards.length} premiações`);

    // Criar inscrições
    console.log("📝 Criando inscrições...");
    const enrollments = [];

    for (const user of users) {
      const numEnrollments = Math.floor(Math.random() * 3) + 1;
      const userEvents = events
        .sort(() => 0.5 - Math.random())
        .slice(0, numEnrollments);

      for (const event of userEvents) {
        const enrollment = await prisma.enrollment.create({
          data: {
            userId: user.id,
            eventId: event.id,
            status: Math.random() > 0.1 ? "APPROVED" : "PENDING",
            enrollmentDate: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
            ),
          },
        });
        enrollments.push(enrollment);
      }
    }
    console.log(`✅ Criadas ${enrollments.length} inscrições`);

    // Criar crachás (UM POR USUÁRIO)
    console.log("🎫 Criando crachás...");
    const badges = [];
    const qrCodeDir = path.join(process.cwd(), "uploads", "qrcodes");
    await fs.mkdir(qrCodeDir, { recursive: true });

    for (const user of users) {
      const qrData = {
        userId: user.id,
        timestamp: Date.now(),
      };

      const qrCodeFileName = `badge_${user.id}.png`;
      const qrCodePath = path.join(qrCodeDir, qrCodeFileName);

      await QRCode.toFile(qrCodePath, JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });

      // Verifica se o usuário tem inscrições aprovadas antes de criar crachá?
      // Opcional. Vamos criar para todos os usuários de teste para facilitar.
      const badge = await prisma.userBadge.create({
        data: {
          userId: user.id,
          qrCodeUrl: `/uploads/qrcodes/${qrCodeFileName}`,
          badgeImageUrl: `/uploads/badges/placeholder.png`,
          badgeCode: `BADGE-${user.id.substring(0, 8).toUpperCase()}`,
        },
      });
      badges.push(badge);
    }
    console.log(`✅ Criados ${badges.length} crachás para usuários`);

    // Criar check-ins
    console.log("✅ Criando check-ins...");
    const checkins = [];

    for (const badge of badges) {
      // Buscar eventos em que o usuário está inscrito e APROVADO
      const userEnrollments = await prisma.enrollment.findMany({
        where: {
          userId: badge.userId,
          status: "APPROVED"
        }
      });

      // Se tiver inscrições, criar checkins aleatórios
      if (userEnrollments.length > 0) {
        // Checkin em 1 ou 2 eventos
        const eventsToCheckin = userEnrollments.slice(0, 2);
        for (const enrollment of eventsToCheckin) {
          const checkin = await prisma.userCheckin.create({
            data: {
              userBadgeId: badge.id,
              eventId: enrollment.eventId,
              checkinTime: new Date(Date.now() - Math.random() * 10000000),
              location: "Recepção"
            }
          });
          checkins.push(checkin);
        }
      }
    }
    console.log(`✅ Criados ${checkins.length} check-ins`);

    // Conceder premiações automáticas
    console.log("🏅 Concedendo premiações...");
    const userAwards = [];

    for (const user of users) {
      const userCheckins = await prisma.userCheckin.count({
        where: { userBadge: { userId: user.id } },
      });

      const userEventsCount = await prisma.enrollment.count({
        where: { userId: user.id, status: "APPROVED" },
      });

      const userAwardsToGrant = [];
      if (userCheckins >= 1) userAwardsToGrant.push(awards.find((a) => a.name === "Primeiro Check-in"));
      if (userEventsCount >= 3) userAwardsToGrant.push(awards.find((a) => a.name === "Participante Assíduo"));

      for (const award of userAwardsToGrant.filter(Boolean)) {
        const exists = await prisma.userAward.findUnique({
          where: { userId_awardId: { userId: user.id, awardId: award.id } }
        });

        if (!exists) {
          const userAward = await prisma.userAward.create({
            data: { userId: user.id, awardId: award.id },
          });
          userAwards.push(userAward);
        }
      }
    }
    console.log(`✅ Concedidas ${userAwards.length} premiações`);

    // Avaliações
    console.log("⭐ Criando avaliações...");
    const evaluations = [];
    const approvedEnrollments = enrollments.filter(e => e.status === "APPROVED");

    for (const enrollment of approvedEnrollments.slice(0, 10)) {
      const evaluation = await prisma.courseEvaluation.create({
        data: {
          enrollmentId: enrollment.id,
          rating: 5,
          comment: "Ótimo evento!"
        }
      });
      evaluations.push(evaluation);
    }
    console.log(`✅ Criadas ${evaluations.length} avaliações`);

    // --- STAFF ---
    console.log("👔 Criando staff de teste...");

    const coordinatorUser = await prisma.user.create({
      data: {
        name: "Coordenador Checkin",
        email: "coord@cracha.com",
        password: hashedPassword,
        role: "CHECKIN_COORDINATOR",
        birthDate: new Date("1990-01-01"),
        cpf: "999.999.999-99",
        phone: "(11) 98888-8888",
        address: "Rua do Staff, 100",
      },
    });

    const speakerUser = await prisma.user.create({
      data: {
        name: "Palestrante Real",
        email: "speaker@cracha.com",
        password: hashedPassword,
        role: "SPEAKER",
        birthDate: new Date("1980-01-01"),
        cpf: "888.888.888-88",
        phone: "(11) 97777-7777",
        address: "Av. do Conhecimento, 200",
      },
    });

    const targetEvent = events[1];
    if (targetEvent) {
      await prisma.eventStaff.create({
        data: {
          userId: coordinatorUser.id,
          eventId: targetEvent.id,
          role: "CHECKIN_COORDINATOR",
        },
      });

      await prisma.eventStaff.create({
        data: {
          userId: speakerUser.id,
          eventId: targetEvent.id,
          role: "SPEAKER",
        },
      });
      console.log(`✅ Staff vinculado ao evento: ${targetEvent.title}`);
    }

    console.log("\n🎉 Seed concluído com sucesso!");
    console.log("\n📋 Credenciais de acesso:");
    console.log("👨‍💼 Admin: admin@cracha.com / 123456");
    console.log("👔 Coordenador: coord@cracha.com / 123456");
    console.log("🎤 Palestrante: speaker@cracha.com / 123456");
    console.log("👤 Usuário: user1@cracha.com / 123456");

  } catch (error) {
    console.error("❌ Erro durante o seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
});
