const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Estado em memória para mídia ativa per evento
const activeMedia = new Map();

const setupSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === "production"
        ? (process.env.CORS_ORIGIN || "https://eduagenda.simplisoft.com.br")
        : ["http://localhost:5173", "http://localhost:3001"],
      methods: ["GET", "POST"],
    },
  });

  // Global monitoring
  io.on("connection", (socket) => {
    console.log(`[SOCKET-DEBUG] Novo socket conectado: ${socket.id}`);

    socket.onAny((eventName, ...args) => {
      console.log(`[SOCKET-INCOMING] De: ${socket.id} | Evento: ${eventName}`, args);
    });

    // Entrar na sala do evento
    socket.on("join_event_room", async ({ eventId, user }) => {
      socket.join(eventId);
      console.log(`[SOCKET] Usuário ${user?.name || socket.id} entrou na sala ${eventId}`);

      // Sincronizar estado atual assim que entrar
      try {
        // 1. Buscar pergunta em destaque no DB
        const highlightedQuestion = await prisma.question.findFirst({
          where: { eventId, isHighlighted: true },
          include: { user: { select: { name: true, photoUrl: true } } }
        });
        if (highlightedQuestion) {
          console.log(`[SOCKET] Sincronizando pergunta para ${socket.id}`);
          socket.emit("question_highlighted", highlightedQuestion);
        }

        // 2. Buscar mídia em destaque na memória
        const currentMedia = activeMedia.get(eventId);
        if (currentMedia) {
          console.log(`[SOCKET] Sincronizando mídia para ${socket.id}`);
          socket.emit("media_highlighted", currentMedia);
        }
      } catch (err) {
        console.error("[SOCKET] Erro ao sincronizar estado inicial:", err);
      }

      const roomSize = io.sockets.adapter.rooms.get(eventId)?.size || 0;
      console.log(`[SOCKET] Sala ${eventId} agora tem ${roomSize} participantes`);
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

    socket.on("highlight_media", ({ eventId, media }) => {
      console.log(`[SOCKET] Projetando mídia na sala ${eventId}:`, media);

      // Salvar no estado global
      if (media) {
        activeMedia.set(eventId, media);
      } else {
        activeMedia.delete(eventId);
      }

      // media: { type: 'youtube' | 'pdf' | 'web', url: '...' }
      io.to(eventId).emit("media_highlighted", activeMedia.get(eventId) || null);

      const roomSize = io.sockets.adapter.rooms.get(eventId)?.size || 0;
      if (roomSize === 0) {
        console.warn(`[SOCKET] Alerta: Mídia enviada para sala ${eventId} que não tem participantes!`);
      }
    });

    // --- SORTEIOS (GIVEAWAYS) ---
    // --- SORTEIOS (GIVEAWAYS) ---
    socket.on("prepare_giveaway", ({ eventId, config, prize }) => {
      io.to(eventId).emit("giveaway_prepared", { config, prize: prize || "Sorteio" });
    });

    socket.on("start_giveaway", async ({ eventId, config, prize }) => {
      let winner = null;
      let displayResult = "Sorteio";
      let displayTitle = prize || "Vencedor(a)";

      if (config) {
        const qty = parseInt(config.quantity) || 1;
        const options = config.options || {};

        if (config.type === 'numbers') {
          const min = parseInt(config.min);
          const max = parseInt(config.max);

          let results = [];
          if (options.allowRepeat) {
            for (let i = 0; i < qty; i++) {
              results.push(Math.floor(Math.random() * (max - min + 1)) + min);
            }
          } else {
            // Unique Random Numbers
            const pool = Array.from({ length: max - min + 1 }, (_, i) => i + min);
            const shuffled = pool.sort(() => 0.5 - Math.random());
            results = shuffled.slice(0, qty);
          }

          if (options.sortResults) {
            results.sort((a, b) => a - b);
          }

          displayResult = results.join(", ");
          winner = { name: displayResult };
          // If no prize name, default to context
          if (!prize) displayTitle = qty > 1 ? "Números Sorteados" : "Número Sorteado";
        }
        else if (config.type === 'names') {
          const items = config.items;

          if (items && items.length > 0) {
            let selected = [];
            if (options.allowRepeat) {
              for (let i = 0; i < qty; i++) {
                selected.push(items[Math.floor(Math.random() * items.length)]);
              }
            } else {
              const shuffled = [...items].sort(() => 0.5 - Math.random());
              selected = shuffled.slice(0, qty);
            }

            if (options.sortResults) {
              selected.sort(); // Alphabetical sort
            }

            displayResult = selected.join(" e ");
            winner = { name: displayResult };
            if (!prize) displayTitle = qty > 1 ? "Vencedores" : "Vencedor(a)";
          } else {
            winner = { name: "Lista Vazia" };
            displayTitle = "Erro";
          }
        }
      } else {
        winner = { name: "Configuração inválida" };
      }

      io.to(eventId).emit("giveaway_started", { prize: prize || "Sorteando..." });

      const duration = (config?.options?.countdown === false) ? 0 : 4000;

      setTimeout(() => {
        io.to(eventId).emit("giveaway_winner", {
          winner,
          prize: displayTitle,
          config
        });
      }, duration);
    });

    socket.on("slide_action", ({ eventId, action }) => {
      console.log(`[SOCKET] Slide Action na sala ${eventId}: ${action}`);
      io.to(eventId).emit("slide_action_triggered", { action });
    });

    socket.on("disconnect", () => {
      console.log(`Socket desconectado: ${socket.id}`);
    });
  });

  return io;
};

module.exports = setupSockets;
