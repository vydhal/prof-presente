const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getAllEquipments = async (req, res) => {
    try {
        const equipments = await prisma.equipment.findMany({
            orderBy: { name: "asc" }
        });
        res.json(equipments);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar equipamentos." });
    }
};

const getEquipmentAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: "Data é obrigatória." });

        const equipments = await prisma.equipment.findMany();

        // Buscar todas as reservas aprovadas para esta data
        // Normalizar data para UTC 00:00 - 23:59 para busca consistente
        const [year, month, day] = date.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

        const approvedReservations = await prisma.spaceReservation.findMany({
            where: {
                status: "APPROVED",
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        const availability = equipments.map(eq => {
            const usedCount = approvedReservations.filter(r => {
                const eqData = r.equipment || {};
                return eqData[eq.id] === true;
            }).length;

            return {
                ...eq,
                available: eq.totalQuantity - usedCount,
                used: usedCount
            };
        });

        res.json(availability);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao consultar disponibilidade." });
    }
};

const createEquipment = async (req, res) => {
    try {
        const { name, totalQuantity, icon } = req.body;
        const equipment = await prisma.equipment.create({
            data: {
                name,
                totalQuantity: parseInt(totalQuantity) || 0,
                icon: icon || "Layout"
            }
        });
        res.status(201).json(equipment);
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar equipamento." });
    }
};

const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, totalQuantity, icon } = req.body;
        const equipment = await prisma.equipment.update({
            where: { id },
            data: {
                name,
                totalQuantity: parseInt(totalQuantity) || 0,
                icon
            }
        });
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar equipamento." });
    }
};

const deleteEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.equipment.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Erro ao excluir equipamento." });
    }
};

module.exports = {
    getAllEquipments,
    getEquipmentAvailability,
    createEquipment,
    updateEquipment,
    deleteEquipment
};
