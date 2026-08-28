const { PrismaClient } = require('@prisma/client');
const embeds = require('../utils/embeds');

const prisma = new PrismaClient();
const userMessageMap = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    try {
      let settings = await prisma.guildSettings.findUnique({
        where: { guildId: message.guild.id }
      });

      if (!settings) {
        settings = await prisma.guildSettings.create({
          data: { guildId: message.guild.id }
        });
      }

      // Check module toggles
      const isSecurityEnabled = settings.securityEnabled ?? true;
      const isAntiSpamEnabled = settings.antiSpamEnabled ?? false;
      const isAntiStickerEnabled = settings.antiStickerEnabled ?? false;

      if (!isSecurityEnabled && !isAntiSpamEnabled && !isAntiStickerEnabled) return;

      // Whitelist check
      const isOwner = message.author.id === message.guild.ownerId;
      const isWhitelisted = settings.whitelistedUsers?.includes(message.author.id) || isOwner;
      
      if (isWhitelisted) return;

      // Sticker handling
      if (message.stickers && message.stickers.size > 0) {
        if (isAntiStickerEnabled) {
          await message.delete().catch(() => {});
          const stickerWarn = await message.channel.send({
            embeds: [embeds.warning('Stickers Restricted', `${message.author}, stickers are disabled in this server.`)]
          });
          setTimeout(() => stickerWarn.delete().catch(() => {}), 5000);
          return;
        }
      }

      // Anti-Spam protection
      if (isAntiSpamEnabled) {
        const userId = message.author.id;
        const now = Date.now();
        const limit = settings.antiSpamThreshold || 5;
        const timeWindow = 5000;

        if (!userMessageMap.has(userId)) {
          userMessageMap.set(userId, []);
        }

        const timestamps = userMessageMap.get(userId);
        timestamps.push(now);

        const recentTimestamps = timestamps.filter(t => now - t < timeWindow);
        userMessageMap.set(userId, recentTimestamps);

        if (recentTimestamps.length > limit) {
          userMessageMap.delete(userId);

          await message.delete().catch(() => {});

          const warnMsg = await message.channel.send({
            embeds: [embeds.warning('Anti-Spam Triggered', `${message.author}, please refrain from sending messages so quickly.`)]
          });

          setTimeout(() => warnMsg.delete().catch(() => {}), 6000);
          return;
        }
      }
    } catch (error) {
      console.error('[ERROR] Execution failed in messageCreate event:', error);
    }
  }
};
