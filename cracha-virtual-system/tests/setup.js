const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async () => {
  console.log('Setting up test environment...');
  // Limpar tabelas ou setup global se necessário
  // await prisma.user.deleteMany();
  // await prisma.event.deleteMany();
};
