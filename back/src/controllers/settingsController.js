const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get current system settings
const getSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findFirst();

        // If no settings exist, create default ones
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    platformName: "SEDUC Eventos",
                    primaryColor: "#137fec",
                },
            });
        }

        res.json(settings);
    } catch (error) {
        console.error("Erro ao buscar configurações:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Update system settings
const updateSettings = async (req, res) => {
    try {
        const { platformName, primaryColor } = req.body;
        let settings = await prisma.systemSettings.findFirst();

        const updateData = {};
        if (platformName) updateData.platformName = platformName;
        if (primaryColor) updateData.primaryColor = primaryColor;

        // Handle file uploads (Logo and Favicon)
        if (req.files) {
            if (req.files.logo) {
                updateData.logoUrl = `/uploads/branding/${req.files.logo[0].filename}`;
            }
            if (req.files.favicon) {
                updateData.faviconUrl = `/uploads/branding/${req.files.favicon[0].filename}`;
            }
        }

        if (settings) {
            settings = await prisma.systemSettings.update({
                where: { id: settings.id },
                data: updateData,
            });
        } else {
            settings = await prisma.systemSettings.create({
                data: {
                    ...updateData,
                    platformName: platformName || "SEDUC Eventos",
                    primaryColor: primaryColor || "#137fec",
                },
            });
        }

        res.json({
            message: "Configurações atualizadas com sucesso!",
            settings,
        });
    } catch (error) {
        console.error("Erro ao atualizar configurações:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

module.exports = {
    getSettings,
    updateSettings,
};
