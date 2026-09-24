const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test(userId) {
    console.log(`\nTesting getMyTracks for user: ${userId}`);
    try {
        const enrollments = await prisma.trackEnrollment.findMany({
            where: { userId },
            include: {
                track: {
                    include: {
                        events: {
                            include: {
                                event: {
                                    select: {
                                        id: true,
                                        title: true,
                                        startDate: true,
                                        endDate: true,
                                        location: true,
                                        userCheckins: {
                                            where: { userBadge: { userId } },
                                            take: 1
                                        }
                                    }
                                }
                            },
                            orderBy: { order: "asc" }
                        },
                        _count: {
                            select: { events: true }
                        }
                    }
                }
            },
            orderBy: { updatedAt: "desc" }
        });
        console.log(`Found ${enrollments.length} enrollments.`);
        if (enrollments.length > 0) {
            console.log('First enrollment track events:', enrollments[0].track.events.length);
        }
    } catch (error) {
        console.error('QUERY FAILED:', error);
    }
}

async function main() {
    const users = await prisma.user.findMany({
        where: { email: { in: ['admin@cracha.com', 'user3@cracha.com'] } },
        select: { id: true, email: true }
    });

    for (const user of users) {
        await test(user.id);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
