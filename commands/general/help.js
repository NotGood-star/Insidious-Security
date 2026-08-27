const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display full list of Insidious Security commands and usage'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const helpEmbed = embeds.security(
      'Insidious Security Command Matrix',
      `${embeds.emojis.CROWN} **Security & Protection**\n` +
      `┗ \`/setup\` - Perform one-click server security initialization\n` +
      `┗ \`/security status\` - View current security toggles & module states\n` +
      `┗ \`/security toggle\` - Enable/Disable Anti-Spam, Anti-Link, or Anti-Raid\n` +
      `┗ \`/antiraid config\` - Adjust raid join thresholds per minute\n` +
      `┗ \`/antiraid lockdown\` - Manually lock or unlock text channel sending\n\n` +
      `${embeds.emojis.LOGS} **Whitelist & Audit**\n` +
      `┗ \`/whitelistadd\` - Whitelist users or roles from security triggers\n` +
      `┗ \`/whitelistremove\` - Remove entries from active security whitelist\n` +
      `┗ \`/whitelistlist\` - Display all whitelisted users and roles\n` +
      `┗ \`/logs\` - View security audit logs recorded in PostgreSQL\n\n` +
      `${embeds.emojis.MOD} **Moderation & System**\n` +
      `┗ \`/verification\` - Deploy interactive button verification panel\n` +
      `┗ \`/mod kick / ban / purge\` - Perform manual moderation actions\n` +
      `┗ \`/ping\` - Check API, WebSocket, and PostgreSQL database latency`
    );

    return interaction.editReply({ embeds: [helpEmbed] });
  }
};
