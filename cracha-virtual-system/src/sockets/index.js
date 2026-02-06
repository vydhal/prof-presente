const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const setupSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? "https://checkin.simplisoft.com.br" 
        : ["http://localhost:5173", "http://localhost:3001"],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    // Entrar na sala do evento
    socket.on("join_event_room", ({ eventId, user }) => {
      socket.join(eventId);
      console.log(`Usuário ${user?.name || socket.id} entrou na sala ${eventId}`);
      
      // Opcional: Notificar quantos estão online
      const roomSize = io.sockets.adapter.rooms.get(eventId)?.size || 0;
      io.to(eventId).emit("room_update", { onlineCount: roomSize });
    });

    // --- PERGUNTAS (Q&A) ---
    socket.on("new_question", async ({ eventId, userId, text }) => {
      try {
        const question = await prisma.question.create({
          data: {
            text,
            userId,
            eventId,
            isApproved: true, // Auto-aprovar por enquanto (ou false se quiser moderação)
          },
          include: { user: { select: { name: true, id: true } } },
        });
        // Emitir para todos na sala
        io.to(eventId).emit("question_received", question);
      } catch (error) {
        console.error("Erro ao salvar pergunta:", error);
        socket.emit("error", { message: "Erro ao enviar pergunta" });
      }
    });

    socket.on("vote_question", async ({ questionId, eventId }) => {
      try {
        const question = await prisma.question.update({
          where: { id: questionId },
          data: { votes: { increment: 1 } },
        });
        io.to(eventId).emit("question_updated", question);
      } catch (error) {
        console.error("Erro ao votar:", error);
      }
    });

    socket.on("highlight_question", async ({ questionId, eventId }) => {
      try {
        // Desmarcar destaque anterior
        await prisma.question.updateMany({
          where: { eventId, isHighlighted: true },
          data: { isHighlighted: false },
        });

        if (questionId) {
          // Marcar novo destaque
          const question = await prisma.question.update({
            where: { id: questionId },
            data: { isHighlighted: true },
            include: { user: { select: { name: true, photoUrl: true } } }
          });
          io.to(eventId).emit("question_highlighted", question);
        } else {
          // Apenas limpou o destaque
          io.to(eventId).emit("question_highlighted", null);
        }
      } catch (error) {
        console.error("Erro ao destacar pergunta:", error);
      }
    });

    socket.on("toggle_approval", async ({ questionId, eventId, isApproved }) => {
      try {
        const question = await prisma.question.update({
          where: { id: questionId },
          data: { isApproved },
        });
        io.to(eventId).emit("question_updated", question);
      } catch (error) {
        console.error("Erro ao moderar pergunta:", error);
      }
    });

    socket.on("mark_answered", async ({ questionId, eventId }) => {
      try {
        const question = await prisma.question.update({
          where: { id: questionId },
          data: { isAnswered: true, isHighlighted: false }, // Remove destaque se respondida
        });
        io.to(eventId).emit("question_updated", question);
        io.to(eventId).emit("question_highlighted", null); // Limpa destaque no telão
      } catch (error) {
        console.error("Erro ao marcar respondida:", error);
      }
    });

    // --- SORTEIOS (GIVEAWAYS) ---
    socket.on("start_giveaway", async ({ eventId, prize }) => {
      // Avisa a todos que vai começar (animação de suspense)
      io.to(eventId).emit("giveaway_started", { prize });

      // Simula um delay de suspense (5s) antes de escolher o vencedor
      setTimeout(async () => {
        try {
          // Busca inscritos que fizeram check-in (status APPROVED e log de certificado PENDING ou APPROVED? Melhor: quem fez check-in)
          // Simplificação V1: Todos os inscritos no evento
          const enrollments = await prisma.enrollment.findMany({
            where: { eventId, status: "APPROVED" },
            include: { user: true },
          });

          if (enrollments.length === 0) {
            io.to(eventId).emit("giveaway_error", { message: "Nenhum participante elegível." });
            return;
          }

          // Escolhe aleatório
          const randomIdx = Math.floor(Math.random() * enrollments.length);
          const winner = enrollments[randomIdx].user;

          // Salva no banco
          const giveaway = await prisma.giveaway.create({
            data: {
              eventId,
              prize,
              winnerId: winner.id,
            },
          });

          // Anuncia vencedor
          io.to(eventId).emit("giveaway_winner", {
            winner: { name: winner.name, id: winner.id },
            prize,
            giveawayId: giveaway.id
          });

        } catch (error) {
          console.error("Erro no sorteio:", error);
          io.to(eventId).emit("giveaway_error", { message: "Falha ao realizar sorteio." });
        }
      }, 5000); // 5 segundos de suspense
    });

    socket.on("disconnect", () => {
      console.log(`Socket desconectado: ${socket.id}`);
    });
  });

  return io;
};

module.exports = setupSockets;
