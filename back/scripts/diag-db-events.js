require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkEvents() {
    try {
        const events = await prisma.event.findMany({
            orderBy: { startDate: 'desc' }
        });

        console.log(`Encontrados ${events.length} eventos no banco:`);
        events.forEach(e => {
            console.log(`- [${e.id}] ${e.title}`);
            console.log(`  Inicio: ${e.startDate.toISOString()}`);
            console.log(`  Fim: ${e.endDate.toISOString()}`);
            console.log(`  Privado: ${e.isPrivate}`);
            console.log('---');
        });

        const now = new Date();
        const upcoming = events.filter(e => {
            const endDate = new Date(e.endDate);
            return endDate.getTime() + (4 * 60 * 60 * 1000) >= now.getTime();
        });

        console.log(`Eventos que deveriam aparecer como 'Próximos' (agora: ${now.toISOString()}):`);
        upcoming.forEach(e => console.log(`- ${e.title}`));

    } catch (e) {
        console.error("Erro ao verificar eventos:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkEvents();
