const embeds = require('../utils/embeds');
const { prisma } = require('../utils/database');

// In-memory tracker for anti-spam detection
const userMessageMap = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore direct messages, system messages, and bot accounts
    if (!message.guild || message.author.bot) return;

    try {
      // Fetch server configuration from PostgreSQL via Prisma
      let settings = await prisma.guildSettings.findUnique({
        where: { guildId: message.guild.id }
      });

      // Initialize default settings record if none exists for this guild
      if (!settings) {
        settings = await prisma.guildSettings.create({
          data: { guildId: message.guild.id }
        });
      }

      // --- BUG 1 FIX: MODULE TOGGLE CHECK ---
      // If global security AND anti-spam modules are disabled, immediately exit
      const isSecurityEnabled = settings.securityEnabled ?? true;
      const isAntiSpamEnabled = settings.antiSpamEnabled ?? false;
      const isAntiStickerEnabled = settings.antiStickerEnabled ?? false;

      if (!isSecurityEnabled && !isAntiSpamEnabled && !isAntiStickerEnabled) return;

      // --- WHITELIST & OWNER BYPASS ---
      const isOwner = message.author.id === message.guild.ownerId;
      const isWhitelisted = settings.whitelistedUsers?.includes(message.author.id) || isOwner;
      
      if (isWhitelisted) return;

      // --- BUG 2 FIX: STICKER PENALTY HANDLER ---
      // Only process stickers if antiSticker module is active; prevents false penalties
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

      // --- BUG 3 FIX: RELIABLE ANTI-SPAM TRACKER ---
      if (isAntiSpamEnabled) {
        const userId = message.author.id;
        const now = Date.now();
        const limit = settings.antiSpamThreshold || 5; // Max allowed messages
        const timeWindow = 5000; // 5-second interval

        if (!userMessageMap.has(userId)) {
          userMessageMap.set(userId, []);
        }

        const timestamps = userMessageMap.get(userId);
        timestamps.push(now);

        // Keep only timestamps within the current window
        const recentTimestamps = timestamps.filter(t => now - t < timeWindow);
        userMessageMap.set(userId, recentTimestamps);

        // Trigger anti-spam action if threshold exceeded
        if (recentTimestamps.length > limit) {
          userMessageMap.delete(userId); // Reset tracker after penalty

          await message.delete().catch(() => {});

          const warnMsg = await message.channel.send({
            embeds: [embeds.warning('Anti-Spam Triggered', `${message.author}, please refrain from sending messages so quickly.`)]
          });

          // Auto-delete warning embed after 6 seconds
          setTimeout(() => warnMsg.delete().catch(() => {}), 6000);
          return;
        }
      }
    } catch (error) {
      console.error(`[ERROR] Execution failed in messageCreate event:`, error);
    }
  }
};
