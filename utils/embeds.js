const { EmbedBuilder } = require('discord.js');

const EMOJIS = {
  MOD: '<:Mod:1542472581251072010>',
  WARN: '<:Warn:1542472381791080559>',
  CROWN: '<:crown:1542472791457144852>',
  MEMBER: '<:Member:1541403131613806602>',
  LOGS: '<a:GeneralSupport:1541400818563948726>',
  CHECK: '<a:Verified:1541401914065821748>',
  CROSS: '<:report:1542488620001263727>',
  BAN: '<a:BanCat:1542489302175588424>',
  KICK: '<:Hazard:1542491035555332146>'
};

module.exports = {
  emojis: EMOJIS,

  success(title, description) {
    return new EmbedBuilder()
      .setTitle(`${EMOJIS.CHECK} ${title}`)
      .setDescription(description)
      .setColor('#2b2d31')
      .setTimestamp();
  },

  error(title, description) {
    return new EmbedBuilder()
      .setTitle(`${EMOJIS.CROSS} ${title}`)
      .setDescription(description)
      .setColor('#ed4245')
      .setTimestamp();
  },

  warning(title, description) {
    return new EmbedBuilder()
      .setTitle(`${EMOJIS.WARN} ${title}`)
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
  },

  audit(title, description) {
    return new EmbedBuilder()
      .setTitle(`${EMOJIS.LOGS} ${title}`)
      .setDescription(description)
      .setColor('#7289da')
      .setTimestamp();
  }
};
