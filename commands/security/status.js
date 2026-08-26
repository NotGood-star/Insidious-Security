const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('security')
    .setDescription('Manage multi-guild security engine configurations')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('View current security settings and active protections')
    ),

  async execute(interaction, client) {
    // 1. Defer reply immediately so Discord knows the bot is working
    await interaction.deferReply();

    try {
      // 2. Query database (can take >3s without throwing a timeout error now)
      let config = await client.db.guildConfig.findUnique({
        where: { guildId: interaction.guild.id }
      });

      // Auto-create config if missing
      if (!config) {
        config = await client.db.guildConfig.create({
          data: { guildId: interaction.guild.id }
        });
      }

      const antiRaidStatus = config?.antiRaidEnabled ? '🟢 Enabled' : '🔴 Disabled';
      const antiSpamStatus = config?.antiSpamEnabled ? '🟢 Enabled' : '🔴 Disabled';
      const antiLinkStatus = config?.antiLinkEnabled ? '🟢 Enabled' : '🔴 Disabled';

      const embed = embeds.security(
        'Server Security Status Overview',
        `**Guild ID:** \`${interaction.guild.id}\`\n\n` +
        `🛡️ **Anti-Raid Protection:** ${antiRaidStatus}\n` +
        `⚡ **Join Threshold:** \`${config?.antiRaidThreshold || 10} joins / min\`\n` +
        `💬 **Anti-Spam Monitor:** ${antiSpamStatus}\n` +
        `🔗 **Anti-Link Filter:** ${antiLinkStatus}\n` +
        `🔐 **Verification System:** ${config?.verificationChannelId ? `<#${config.verificationChannelId}>` : '`Not Configured`'}\n` +
        `📋 **Security Audit Channel:** ${config?.securityChannelId ? `<#${config.securityChannelId}>` : '`Not Set`'}`
      );

      // 3. Edit initial deferred message
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({
        embeds: [embeds.error('Database Error', `Failed to load settings: \`${err.message}\``)]
      });
    }
  }
};
