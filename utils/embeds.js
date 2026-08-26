const { EmbedBuilder } = require('discord.js');

const COLORS = {
  SUCCESS: 0x2ECC71,
  ERROR: 0xE74C3C,
  WARNING: 0xF1C40F,
  INFO: 0x3498DB,
  SECURITY: 0x9B59B6,
  MODERATION: 0xE67E22,
  MUSIC: 0x1DB954
};

function baseEmbed(color, title, description) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTimestamp();
    
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  
  return embed;
}

module.exports = {
  success: (title, desc) => baseEmbed(COLORS.SUCCESS, `🟢 ${title}`, desc),
  error: (title, desc) => baseEmbed(COLORS.ERROR, `🔴 ${title}`, desc),
  warning: (title, desc) => baseEmbed(COLORS.WARNING, `🟡 ${title}`, desc),
  info: (title, desc) => baseEmbed(COLORS.INFO, `🔵 ${title}`, desc),
  security: (title, desc) => baseEmbed(COLORS.SECURITY, `🛡️ ${title}`, desc),
  moderation: (title, desc) => baseEmbed(COLORS.MODERATION, `🔨 ${title}`, desc),
  music: (title, desc) => baseEmbed(COLORS.MUSIC, `🎵 ${title}`, desc)
};
