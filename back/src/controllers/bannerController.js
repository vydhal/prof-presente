const { prisma } = require("../config/database");

// Listar todos os banners (Admin)
const getAllBanners = async (req, res) => {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: { order: "asc" }
        });
        res.json(banners);
    } catch (error) {
        console.error("Erro ao listar banners:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Listar apenas banners ativos (Público)
const getActiveBanners = async (req, res) => {
    try {
        const banners = await prisma.banner.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" }
        });
        res.json(banners);
    } catch (error) {
        console.error("Erro ao listar banners ativos:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Criar novo banner
const createBanner = async (req, res) => {
    try {
        const { title, description, linkUrl, order, isActive } = req.body;
        let imageUrl = null;

        if (req.file) {
            imageUrl = `/uploads/banners/${req.file.filename}`;
        }

        if (!imageUrl) {
            return res.status(400).json({ error: "Imagem é obrigatória" });
        }

        const banner = await prisma.banner.create({
            data: {
                title,
                description,
                imageUrl,
                linkUrl,
                order: parseInt(order) || 0,
                isActive: isActive === "true" || isActive === true
            }
        });

        res.status(201).json(banner);
    } catch (error) {
        console.error("Erro ao criar banner:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Atualizar banner
const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, linkUrl, order, isActive } = req.body;

        const existingBanner = await prisma.banner.findUnique({ where: { id } });
        if (!existingBanner) {
            return res.status(404).json({ error: "Banner não encontrado" });
        }

        let imageUrl = existingBanner.imageUrl;
        if (req.file) {
            imageUrl = `/uploads/banners/${req.file.filename}`;
            // Poderíamos deletar a imagem antiga aqui se necessário
        }

        const banner = await prisma.banner.update({
            where: { id },
            data: {
                title,
                description,
                imageUrl,
                linkUrl,
                order: parseInt(order) || 0,
                isActive: isActive === "true" || isActive === true
            }
        });

        res.json(banner);
    } catch (error) {
        console.error("Erro ao atualizar banner:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Deletar banner
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.banner.delete({ where: { id } });
        res.json({ message: "Banner removido com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar banner:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

module.exports = {
    getAllBanners,
    getActiveBanners,
    createBanner,
    updateBanner,
    deleteBanner
};
