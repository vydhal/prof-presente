const { prisma } = require("../config/database");
const { invalidateEventCache } = require("./eventController");

/**
 * Adiciona um membro da equipe (Staff) ao evento.
 * Pode ser Coordenador de Check-in ou Palestrante.
 */
const addStaffToEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { email, role } = req.body;



        if (!email || !role) {
            return res.status(400).json({ error: "Email e função (role) são obrigatórios." });
        }

        if (!["CHECKIN_COORDINATOR", "SPEAKER"].includes(role)) {
            return res.status(400).json({ error: "Função inválida. Use CHECKIN_COORDINATOR ou SPEAKER." });
        }

        // 1. Verifica se o evento existe
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) {
            return res.status(404).json({ error: "Evento não encontrado." });
        }

        // 2. Verifica se o usuário existe
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado com este e-mail." });
        }

        // 3. Verifica se já faz parte da equipe
        const existingStaff = await prisma.eventStaff.findUnique({
            where: {
                userId_eventId: {
                    userId: user.id,
                    eventId: eventId
                }
            }
        });

        if (existingStaff) {
            return res.status(409).json({ error: "Este usuário já está vinculado a este evento." });
        }

        // 4. Cria o vínculo (Removida a atualização do papel global do usuário)
        const staffMember = await prisma.eventStaff.create({
            data: {
                userId: user.id,
                eventId: eventId,
                role: role,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, photoUrl: true, role: true },
                },
            },
        });

        // Invalida o cache de eventos para refletir a nova equipe para o usuário
        await invalidateEventCache();

        res.status(201).json(staffMember);
    } catch (error) {
        console.error("Erro ao adicionar staff ao evento:", error);
        res.status(500).json({
            error: "Erro interno do servidor.",
            message: error.message
        });
    }
};

/**
 * Remove um membro da equipe do evento.
 */
const removeStaffFromEvent = async (req, res) => {
    try {
        const { eventId, userId } = req.params;

        const deleted = await prisma.eventStaff.deleteMany({
            where: {
                eventId: eventId,
                userId: userId,
            },
        });

        if (deleted.count === 0) {
            return res.status(404).json({ error: "Vínculo não encontrado." });
        }

        // Invalida o cache de eventos
        await invalidateEventCache();

        res.json({ message: "Membro removido da equipe com sucesso." });
    } catch (error) {
        console.error("Erro ao remover staff:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};

/**
 * Lista a equipe de um evento.
 */
const getEventStaff = async (req, res) => {
    try {
        const { eventId } = req.params;

        const staff = await prisma.eventStaff.findMany({
            where: { eventId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, photoUrl: true, role: true },
                },
            },
        });

        // Agrupa por função para facilitar no frontend
        const coordinators = staff.filter((s) => s.role === "CHECKIN_COORDINATOR");
        const speakers = staff.filter((s) => s.role === "SPEAKER");

        res.json({
            coordinators,
            speakers,
            all: staff
        });
    } catch (error) {
        console.error("Erro ao listar staff:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
};

module.exports = {
    addStaffToEvent,
    removeStaffFromEvent,
    getEventStaff,
};
