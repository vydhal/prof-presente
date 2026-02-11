const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- TRACKS ---');
    const tracks = await prisma.learningTrack.findMany({
        include: { _count: { select: { events: true } } }
    });
    console.log(JSON.stringify(tracks, null, 2));

    console.log('\n--- ENROLLMENTS ---');
    const enrollments = await prisma.trackEnrollment.findMany({
        include: { track: true, user: { select: { id: true, email: true } } }
    });
    console.log(JSON.stringify(enrollments, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
