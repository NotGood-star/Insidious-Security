const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getGuildSettings(guildId) {
  try {
    let settings = await prisma.guildSettings.findUnique({
      where: { guildId }
    });

    if (!settings) {
      settings = await prisma.guildSettings.create({
        data: { guildId }
      });
    }

    return settings;
  } catch (error) {
    console.error(`Error fetching settings for guild ${guildId}:`, error);
    return null;
  }
}

module.exports = {
  prisma,
  getGuildSettings
};
