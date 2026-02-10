const { prisma } = require("../config/database");
const { generateQRCode } = require("../utils/qrcode");

// Função auxiliar para gerar um código legível para o crachá.
const generateBadgeCode = (userName) => {
    const names = userName.trim().split(" ");
    const firstName = names[0].toUpperCase();
    const lastName =
        names.length > 1 ? names[names.length - 1].toUpperCase() : "";
    const randomNumbers = Math.floor(1000 + Math.random() * 9000);

    if (lastName) {
        return `${firstName}-${lastName}-${randomNumbers}`;
    }
    return `${firstName}-${randomNumbers}`;
};

/**
 * Encontra ou cria um crachá para o usuário.
 * Garante que o QR code seja gerado e salvo.
 * @param {string} userId - ID do usuário.
 * @returns {Promise<object>} - O objeto UserBadge com o QR code URL.
 */
const findOrCreateUserBadge = async (userId) => {
    try {
        let userBadge = await prisma.userBadge.findUnique({
            where: { userId },
        });

        if (userBadge) {
            return userBadge;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error("Usuário não encontrado para geração de crachá.");
        }

        let badgeCode;
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            badgeCode = generateBadgeCode(user.name);
            const existing = await prisma.userBadge.findUnique({
                where: { badgeCode },
            });
            if (!existing) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            throw new Error("Não foi possível gerar um código único para o crachá.");
        }

        const qrData = JSON.stringify({
            userId: user.id,
            badgeCode,
            badgeType: "user",
            timestamp: new Date().toISOString(),
        });

        const qrCodeFilename = `user_badge_${user.id}`;
        await generateQRCode(qrData, qrCodeFilename);
        const qrCodeUrl = `/uploads/qrcodes/${qrCodeFilename}.png`;
        const badgeImageUrl = `/api/badges/${user.id}/image`;

        userBadge = await prisma.userBadge.create({
            data: {
                userId: user.id,
                badgeCode,
                qrCodeUrl,
                badgeImageUrl,
            },
            include: {
                user: true
            }
        });

        console.log(`[BadgeService] Crachá criado para usuário ${user.email} (${user.id})`);

        return userBadge;
    } catch (error) {
        console.error("[BadgeService] Erro ao buscar/criar crachá:", error);
        throw error;
    }
};

module.exports = {
    findOrCreateUserBadge,
    generateBadgeCode
};
