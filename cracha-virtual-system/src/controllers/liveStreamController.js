const { prisma } = require("../config/database");
const youtubeService = require("../services/youtubeService");
const { processUserCheckin } = require("./checkinController");

/**
 * Cria ou atualiza a Live Stream vinculada a um evento
 */
const upsertLiveStream = async (req, res) => {
    try {
        const { eventId } = req.params;
        let { provider, streamId, status } = req.body;

        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return res.status(404).json({ error: "Evento não encontrado" });
        }

        // CHECK DE PROPRIEDADE: Organizador só configura transmissão de evento que criou
        if (req.user.role === "ORGANIZER" && event.creatorId !== req.user.id) {
            return res.status(403).json({
                error: "Acesso negado. Você só pode configurar a transmissão de eventos que você criou.",
            });
        }

        // AUTO-CREATION LOGIC
        if (streamId === "auto") {
            try {
                streamId = await youtubeService.createLiveBroadcast(
                    `Transmissão: ${event.title}`,
                    event.description,
                    event.startDate
                );
                provider = "YOUTUBE";
            } catch (err) {
                console.error("Erro criação automática YouTube:", err);
                return res.status(400).json({ error: err.message || "Erro ao gerar transmissão automaticamente." });
            }
        }

        const liveStream = await prisma.liveStream.upsert({
            where: { eventId },
            update: {
                provider,
                streamId,
                status,
            },
            create: {
                eventId,
                provider: provider || "YOUTUBE",
                streamId,
                status: status || "SCHEDULED",
            },
        });

        res.json(liveStream);
    } catch (error) {
        console.error("Erro ao gerenciar Live Stream:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

/**
 * Busca a Live Stream (Permitir apenas se usuário estiver inscrito ou for admin/staff)
 */
const getLiveStream = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;

        // Verificar se a LiveStream existe
        const liveStream = await prisma.liveStream.findUnique({
            where: { eventId },
            include: { event: { select: { creatorId: true } } },
        });

        if (!liveStream) {
            return res.status(404).json({ error: "Live Stream não encontrada" });
        }

        const { event, ...liveStreamData } = liveStream;

        // Admins, Staff e o Organizador dono do evento podem ver sempre
        if (req.user.role === "ADMIN" || req.user.role === "cerimonial") {
            return res.json(liveStreamData);
        }

        if (req.user.role === "ORGANIZER" && event.creatorId === req.user.id) {
            return res.json(liveStreamData);
        }

        const staff = await prisma.eventStaff.findUnique({
            where: { userId_eventId: { userId, eventId } },
        });
        if (staff) {
            return res.json(liveStreamData);
        }

        // Verificar se o usuário está inscrito
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_eventId: {
                    userId,
                    eventId,
                },
            },
        });

        if (!enrollment || enrollment.status !== "APPROVED") {
            return res.status(403).json({ error: "Acesso negado. Você não está inscrito ou sua inscrição não foi aprovada." });
        }

        res.json(liveStreamData);
    } catch (error) {
        console.error("Erro ao buscar Live Stream:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

/**
 * Registra o tempo assistido para automatizar o checkin
 */
const pingAttendance = async (req, res) => {
    try {
        const { id: liveStreamId } = req.params;
        const userId = req.user.id;

        // Atualiza o attendance incrementando 60 segundos
        const attendance = await prisma.liveAttendance.upsert({
            where: {
                liveStreamId_userId: {
                    liveStreamId,
                    userId,
                },
            },
            update: {
                watchTimeSeconds: {
                    increment: 60,
                },
                lastPingAt: new Date(),
            },
            create: {
                liveStreamId,
                userId,
                watchTimeSeconds: 60, // Começa com 60s
            },
            include: {
                liveStream: true, // Para obter o eventId
            }
        });

        // Lógica opcional de Check-in Automático
        // Exemplo: Se assistiu mais de 30 minutos (1800 segundos), realiza o check-in se não existir
        if (attendance.watchTimeSeconds >= 1800) {
            const eventId = attendance.liveStream.eventId;

            const userBadge = await prisma.userBadge.findUnique({
                where: { userId },
            });

            if (userBadge) {
                // Tenta registrar o checkin
                const existingCheckin = await prisma.userCheckin.findFirst({
                    where: { userBadgeId: userBadge.id, eventId }
                });

                if (!existingCheckin) {
                    await prisma.userCheckin.create({
                        data: {
                            userBadgeId: userBadge.id,
                            eventId: eventId,
                            location: "Online / Autocheckin"
                        }
                    });
                    console.log(`[LIVE STREAM] Check-in automático gerado para o usuário ${userId} no evento ${eventId}`);
                }
            }
        }

        res.json({ message: "Ping registrado", watchTimeSeconds: attendance.watchTimeSeconds });
    } catch (error) {
        console.error("Erro no ping attendance:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

/**
 * Busca histórico do chat
 */
const getChatHistory = async (req, res) => {
    try {
        const { id: liveStreamId } = req.params;

        const messages = await prisma.liveChatMessage.findMany({
            where: { liveStreamId, isBlocked: false },
            include: { user: { select: { id: true, name: true, photoUrl: true } } },
            orderBy: { createdAt: "asc" },
            take: 200, // as últimas 200 mensagens
        });

        res.json(messages);
    } catch (error) {
        console.error("Erro ao buscar chat:", error);
        res.status(500).json({ error: "Erro interno" });
    }
};

/**
 * Abre uma nova janela de check-in ao vivo (Organizador/Admin).
 * Idempotente: se já existir uma janela aberta, retorna ela em vez de criar outra.
 */
const openCheckin = async (req, res) => {
    try {
        const { id: liveStreamId } = req.params;

        const liveStream = await prisma.liveStream.findUnique({
            where: { id: liveStreamId },
            include: { event: { select: { creatorId: true } } },
        });

        if (!liveStream) {
            return res.status(404).json({ error: "Live Stream não encontrada" });
        }

        if (req.user.role === "ORGANIZER" && liveStream.event.creatorId !== req.user.id) {
            return res.status(403).json({
                error: "Acesso negado. Você só pode gerenciar o check-in de eventos que você criou.",
            });
        }

        let checkinWindow = await prisma.liveCheckinWindow.findFirst({
            where: { liveStreamId, closedAt: null },
        });

        if (!checkinWindow) {
            checkinWindow = await prisma.liveCheckinWindow.create({
                data: { liveStreamId, openedById: req.user.id },
            });
        }

        const io = req.app.get("io");
        if (io) {
            io.to(`live_${liveStreamId}`).emit("checkin_window_opened", {
                windowId: checkinWindow.id,
                openedAt: checkinWindow.openedAt,
            });
        }

        res.status(201).json(checkinWindow);
    } catch (error) {
        console.error("Erro ao abrir check-in ao vivo:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

/**
 * Encerra a janela de check-in ao vivo aberta (Organizador/Admin)
 */
const closeCheckin = async (req, res) => {
    try {
        const { id: liveStreamId } = req.params;

        const liveStream = await prisma.liveStream.findUnique({
            where: { id: liveStreamId },
            include: { event: { select: { creatorId: true } } },
        });

        if (!liveStream) {
            return res.status(404).json({ error: "Live Stream não encontrada" });
        }

        if (req.user.role === "ORGANIZER" && liveStream.event.creatorId !== req.user.id) {
            return res.status(403).json({
                error: "Acesso negado. Você só pode gerenciar o check-in de eventos que você criou.",
            });
        }

        const checkinWindow = await prisma.liveCheckinWindow.findFirst({
            where: { liveStreamId, closedAt: null },
        });

        if (!checkinWindow) {
            return res.status(404).json({ error: "Não há check-in aberto no momento." });
        }

        const updatedWindow = await prisma.liveCheckinWindow.update({
            where: { id: checkinWindow.id },
            data: { closedAt: new Date() },
        });

        const io = req.app.get("io");
        if (io) {
            io.to(`live_${liveStreamId}`).emit("checkin_window_closed", {
                windowId: updatedWindow.id,
            });
        }

        res.json(updatedWindow);
    } catch (error) {
        console.error("Erro ao encerrar check-in ao vivo:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

/**
 * Retorna a janela de check-in aberta (se houver) e se o usuário logado já confirmou presença.
 * Usado pelo participante no load da sala de transmissão, para não depender só do socket.
 */
const getCheckinStatus = async (req, res) => {
    try {
        const { id: liveStreamId } = req.params;
        const userId = req.user.id;

        const checkinWindow = await prisma.liveCheckinWindow.findFirst({
            where: { liveStreamId, closedAt: null },
            include: { _count: { select: { confirmations: true } } },
        });

        if (!checkinWindow) {
            return res.json({ open: false, window: null, alreadyConfirmed: false });
        }

        const confirmation = await prisma.liveCheckinConfirmation.findUnique({
            where: { windowId_userId: { windowId: checkinWindow.id, userId } },
        });

        res.json({
            open: true,
            window: {
                id: checkinWindow.id,
                openedAt: checkinWindow.openedAt,
                confirmationsCount: checkinWindow._count.confirmations,
            },
            alreadyConfirmed: !!confirmation,
        });
    } catch (error) {
        console.error("Erro ao buscar status do check-in ao vivo:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

/**
 * Participante confirma presença enquanto a janela de check-in está aberta.
 * Reaproveita processUserCheckin (checkinController) para herdar validações,
 * prêmios automáticos e progresso de trilha, exatamente como o check-in facial já faz.
 */
const confirmLiveCheckin = async (req, res) => {
    try {
        const { id: liveStreamId } = req.params;
        const userId = req.user.id;

        const liveStream = await prisma.liveStream.findUnique({
            where: { id: liveStreamId },
        });

        if (!liveStream) {
            return res.status(404).json({ error: "Live Stream não encontrada" });
        }

        const checkinWindow = await prisma.liveCheckinWindow.findFirst({
            where: { liveStreamId, closedAt: null },
        });

        if (!checkinWindow) {
            return res.status(400).json({ error: "Check-in não está liberado no momento." });
        }

        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_eventId: { userId, eventId: liveStream.eventId } },
        });

        if (!enrollment || enrollment.status !== "APPROVED") {
            return res.status(403).json({ error: "Você não está inscrito ou sua inscrição não foi aprovada neste evento." });
        }

        // Log granular do clique — idempotente (não falha se já confirmado nesta janela)
        await prisma.liveCheckinConfirmation.upsert({
            where: { windowId_userId: { windowId: checkinWindow.id, userId } },
            update: {},
            create: { windowId: checkinWindow.id, userId },
        });

        const io = req.app.get("io");
        if (io) {
            const confirmationsCount = await prisma.liveCheckinConfirmation.count({
                where: { windowId: checkinWindow.id },
            });
            io.to(`live_${liveStreamId}`).emit("checkin_confirmed_count", confirmationsCount);
        }

        const userBadge = await prisma.userBadge.findUnique({
            where: { userId },
            include: { user: { select: { id: true, name: true, email: true } } },
        });

        if (!userBadge) {
            return res.status(400).json({
                error: "Presença confirmada, mas você ainda não possui um crachá emitido para gerar o check-in oficial.",
            });
        }

        // Sinaliza para processUserCheckin qual location usar (mesmo padrão do check-in facial).
        // A rota é chamada sem corpo pelo frontend, então req.body pode vir undefined.
        req.body = req.body || {};
        req.body.location = "Online / Check-in ao vivo";
        return await processUserCheckin(req, res, userBadge, liveStream.eventId);
    } catch (error) {
        console.error("Erro ao confirmar check-in ao vivo:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

module.exports = {
    upsertLiveStream,
    getLiveStream,
    pingAttendance,
    getChatHistory,
    openCheckin,
    closeCheckin,
    getCheckinStatus,
    confirmLiveCheckin,
};
