const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// --- GESTÃO DE ESPAÇOS (CERIMONIAL) ---

// Listar todos os espaços
const getAllSpaces = async (req, res) => {
    try {
        const spaces = await prisma.space.findMany({
            orderBy: { name: "asc" },
        });
        res.json(spaces);
    } catch (error) {
        console.error("Erro ao listar espaços:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Criar um novo espaço
const createSpace = async (req, res) => {
    try {
        const { name, capacity, description, location } = req.body;
        const space = await prisma.space.create({
            data: {
                name,
                capacity: parseInt(capacity) || null,
                description,
                location,
            },
        });
        res.status(201).json(space);
    } catch (error) {
        console.error("Erro ao criar espaço:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Atualizar um espaço
const updateSpace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, capacity, description, location } = req.body;
        const space = await prisma.space.update({
            where: { id },
            data: {
                name,
                capacity: parseInt(capacity) || null,
                description,
                location,
            },
        });
        res.json(space);
    } catch (error) {
        console.error("Erro ao atualizar espaço:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Deletar um espaço
const deleteSpace = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.space.delete({ where: { id } });
        res.json({ message: "Espaço removido com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar espaço:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// --- GESTÃO DE RESERVAS ---

// Criar uma nova solicitação de reserva (Organizadores)
const createReservation = async (req, res) => {
    try {
        const {
            spaceId,
            eventTitle,
            requesterName,
            sector,
            date,
            startTime,
            endTime,
            description,
            equipment,
            oneDocNumber,
            needsCerimonial,
            eventScriptUrl,
        } = req.body;

        const requesterId = req.user.id;

        // Validar conflito de reserva no mesmo espaço e horário (Apenas se já aprovado)
        // Por simplicidade inicial, vamos apenas criar o pedido como PENDING.
        // O Cerimonial decidirá sobre conflitos.

        const reservation = await prisma.spaceReservation.create({
            data: {
                spaceId,
                requesterId,
                eventTitle,
                requesterName: requesterName || req.user.name,
                sector,
                date: new Date(date),
                startTime: startTime ? new Date(`${date}T${startTime}:00`) : null,
                endTime: endTime ? new Date(`${date}T${endTime}:00`) : null,
                description,
                equipment: equipment || {},
                oneDocNumber,
                needsCerimonial: needsCerimonial === true || needsCerimonial === 'true',
                eventScriptUrl,
                status: "PENDING",
            },
        });

        res.status(201).json(reservation);
    } catch (error) {
        console.error("Erro ao solicitar reserva:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Listar reservas (Cerimonial vê tudo, Organizador vê as próprias)
const getReservations = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const { status, spaceId, month, year } = req.query;

        const where = {};

        // Filtro por papel
        if (role !== "ADMIN" && role !== "CERIMONIAL") {
            where.requesterId = userId;
        }

        // Filtros opcionais
        if (status) where.status = status;
        if (spaceId) where.spaceId = spaceId;

        if (month && year) {
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0, 23, 59, 59);
            where.date = {
                gte: startOfMonth,
                lte: endOfMonth,
            };
        }

        const reservations = await prisma.spaceReservation.findMany({
            where,
            include: {
                space: true,
                requester: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { date: "asc" },
        });

        res.json(reservations);
    } catch (error) {
        console.error("Erro ao listar reservas:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Atualizar status da reserva (Cerimonial)
const updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, observations, reallocatedTo, spaceId } = req.body;

        // Se estiver aprovando, verificar disponibilidade de equipamentos
        if (status === "APPROVED") {
            const reservation = await prisma.spaceReservation.findUnique({ where: { id } });
            if (!reservation) return res.status(404).json({ error: "Reserva não encontrada." });

            const equipmentsRequested = reservation.equipment || {};
            const requestedKeys = Object.keys(equipmentsRequested).filter(k => equipmentsRequested[k] === true);

            if (requestedKeys.length > 0) {
                // Normalizar data para UTC 00:00 - 23:59 para busca consistente
                const baseDate = new Date(reservation.date);
                const startOfDay = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0));
                const endOfDay = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 23, 59, 59, 999));

                // Buscar todos os equipamentos necessários
                const equipments = await prisma.equipment.findMany({
                    where: { id: { in: requestedKeys } }
                });

                // Buscar reservas aprovadas na mesma data
                const otherApproved = await prisma.spaceReservation.findMany({
                    where: {
                        status: "APPROVED",
                        date: { gte: startOfDay, lte: endOfDay },
                        id: { not: id } // Não contar a própria reserva
                    }
                });

                for (const eq of equipments) {
                    const usedCount = otherApproved.filter(r => {
                        const eqData = r.equipment || {};
                        return eqData[eq.id] === true;
                    }).length;

                    if (usedCount >= eq.totalQuantity) {
                        return res.status(400).json({
                            error: `Indisponível: O item "${eq.name}" já atingiu o limite de estoque (${eq.totalQuantity}) para esta data.`
                        });
                    }
                }
            }
        }

        const updateData = { status };
        if (observations !== undefined) updateData.observations = observations;
        if (reallocatedTo !== undefined) updateData.reallocatedTo = reallocatedTo;
        if (spaceId !== undefined) updateData.spaceId = spaceId;

        const updated = await prisma.spaceReservation.update({
            where: { id },
            data: updateData,
        });

        res.json(updated);
    } catch (error) {
        console.error("Erro ao atualizar status da reserva:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Obter Configurações do Formulário
const getReservationConfig = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await prisma.systemSettings.create({ data: {} });
        }

        if (!settings.reservationConfig) {
            // Default config - Empty equipment forcing choice from inventory
            return res.json({
                equipment: [],
                sectors: ["Ensino Fundamental", "Ed. Infantil", "Administrativo", "Recursos Humanos"]
            });
        }

        res.json(settings.reservationConfig);
    } catch (error) {
        console.error("Erro ao obter config de reserva:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Atualizar Configurações do Formulário
const updateReservationConfig = async (req, res) => {
    try {
        const { equipment, sectors } = req.body;
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await prisma.systemSettings.create({ data: {} });
        }

        const updated = await prisma.systemSettings.update({
            where: { id: settings.id },
            data: {
                reservationConfig: { equipment, sectors }
            }
        });

        res.json(updated.reservationConfig);
    } catch (error) {
        console.error("Erro ao atualizar config de reserva:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Exportar Reservas (CSV)
const exportReservations = async (req, res) => {
    try {
        const { status, spaceId } = req.query;
        const where = {};
        if (status) where.status = status;
        if (spaceId) where.spaceId = spaceId;

        const reservations = await prisma.spaceReservation.findMany({
            where,
            include: { space: true },
            orderBy: { date: "desc" }
        });

        // Simple CSV construction
        const headers = ["Título", "Solicitante", "Setor", "Espaço", "Data", "Início", "Fim", "1Doc", "Cerimonial", "Minuta/Roteiro", "Status"];
        const rows = reservations.map(r => [
            r.eventTitle,
            r.requesterName,
            r.sector,
            r.space?.name,
            new Date(r.date).toLocaleDateString("pt-BR"),
            r.startTime ? new Date(r.startTime).toLocaleTimeString("pt-BR") : "--",
            r.endTime ? new Date(r.endTime).toLocaleTimeString("pt-BR") : "--",
            r.oneDocNumber || "--",
            r.needsCerimonial ? "Sim" : "Não",
            r.eventScriptUrl || "--",
            r.status
        ]);

        const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=reservas.csv");
        res.status(200).send(csvContent);
    } catch (error) {
        console.error("Erro ao exportar reservas:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

module.exports = {
    getAllSpaces,
    createSpace,
    updateSpace,
    deleteSpace,
    createReservation,
    getReservations,
    updateReservationStatus,
    getReservationConfig,
    updateReservationConfig,
    exportReservations,
};
