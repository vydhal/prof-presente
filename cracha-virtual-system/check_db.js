const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const email = "coord@cracha.com";
    console.log(`Checking events for user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            staffEvents: true
        }
    });

    if (!user) {
        console.log("User not found");
        return;
    }

    console.log(`User ID: ${user.id}`);
    console.log(`User Role: ${user.role}`);
    console.log(`Staff Entries Count: ${user.staffEvents.length}`);

    for (const entry of user.staffEvents) {
        const event = await prisma.event.findUnique({
            where: { id: entry.eventId }
        });
        console.log(`- Event: ${event.title} (ID: ${event.id})`);
        console.log(`  Role: ${entry.role}`);
        console.log(`  Dates: ${event.startDate} to ${event.endDate}`);
    }

    const now = new Date();
    const visibilityThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000);
    console.log(`\nCurrent Time: ${now.toISOString()}`);
    console.log(`Visibility Threshold (-4h): ${visibilityThreshold.toISOString()}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
