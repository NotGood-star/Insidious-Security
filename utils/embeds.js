const { EmbedBuilder } = require('discord.js');

// Custom Emojis
const EMOJIS = {
  MOD: '<:Mod:1542472581251072010>',
  WARNING: '<:11838warning:1492812365593317436>',
  CROWN: '<:crown:1542472791457144852>',
  MEMBER: '<:Member:1541403131613806602>'
};

module.exports = {
  emojis: EMOJIS,

  success(title, description) {
    return new EmbedBuilder()
      .setTitle(`${EMOJIS.MOD} ${title}`)
      .setDescription(description)
      .setColor('#2b2d31')
      .setTimestamp();
  },

  error(title, description) {
    return new EmbedBuilder()
      .setTitle(`${EMOJIS.WARNING} ${title}`)
      .setDescription(description)
      .setColor('#ed4245')
      .setTimestamp();
  },

  warning(title, description) {
    return new EmbedBuilder()
      .setTitle(`${EMOJIS.WARNING} ${title}`)
      .setDescription(description)
      .setColor('#fee75c')
      .setTimestamp();
  },

  security(title, description) {
    return new EmbedBuilder()
      .setTitle(`${EMOJIS.CROWN} ${title}`)
      .setDescription(description)
      .setColor('#5865f2')
      .setTimestamp();
  }
};
