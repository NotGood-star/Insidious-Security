const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getGuildSettings(guildId) {
  let config = await prisma.guildConfig.findUnique({
    where: { guildId }
  });

  // Auto-initialize settings if the server uses the bot for the first time
  if (!config) {
    config = await prisma.guildConfig.create({
      data: { guildId }
    });
  }

  return config;
}

module.exports = { getGuildSettings };
