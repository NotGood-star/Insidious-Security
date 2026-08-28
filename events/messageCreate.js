const embeds = require('../utils/embeds');
const { getGuildSettings } = require('../utils/db'); // or your DB utility

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    // Fetch server settings from Database
    const guildData = await getGuildSettings(message.guild.id);
    if (!guildData) return;

    // --- FIX BUG 1: Stop execution immediately if module is disabled ---
    if (!guildData.modules?.security && !guildData.modules?.antiSpam) return;

    // Bypass check for Guild Owner & Admin/Whitelisted users
    const isWhitelisted = guildData.whitelistedUsers?.includes(message.author.id) || message.author.id === message.guild.ownerId;
    if (isWhitelisted) return;

    // --- FIX BUG 2: Handle Stickers safely (Ignore or validate separately) ---
    if (message.stickers && message.stickers.size > 0) {
      // If sticker module is explicitly disabled or not configured, ignore stickers to prevent false punishments
      if (!guildData.modules?.antiSticker) return;
    }

    // --- FIX BUG 3: Anti-Spam Logic ---
    if (guildData.modules?.antiSpam) {
      const isSpamming = await checkSpam(message, guildData);
      if (isSpamming) {
        await message.delete().catch(() => {});
        return message.channel.send({
          embeds: [embeds.warning('Anti-Spam Triggered', `${message.author}, please refrain from spamming.`)]
        });
      }
    }
  }
};
