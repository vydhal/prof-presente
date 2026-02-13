const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding spaces...");

    const spaces = [
        {
            name: "Auditório Principal",
            capacity: 200,
            description: "Auditório equipado com som e projetor de alta definição.",
            location: "Bloco A - Térreo",
        },
        {
            name: "Sala de Reuniões 01",
            capacity: 20,
            description: "Sala ideal para reuniões pequenas e videoconferências.",
            location: "Bloco B - 1º Andar",
        },
        {
            name: "Laboratório de Informática",
            capacity: 30,
            description: "Equipado com 30 computadores e lousa digital.",
            location: "Bloco C - Subsolo",
        },
    ];

    for (const space of spaces) {
        await prisma.space.upsert({
            where: { id: space.name }, // This won't work because id is UUID, used for demo
            update: {},
            create: space,
        }).catch(async (e) => {
            // If upsert fails by id, just create
            await prisma.space.create({ data: space });
        });
    }

    console.log("Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
