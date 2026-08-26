const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('security')
    .setDescription('Manage multi-guild security engine configurations')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('status').setDescription('View current security settings')
    )
    .addSubcommand(sub =>
      sub.setName('toggle')
        .setDescription('Toggle security features on or off')
        .addStringOption(opt =>
          opt.setName('feature')
            .setDescription('Feature to toggle')
            .setRequired(true)
            .addChoices(
              { name: 'Anti-Raid', value: 'antiRaid' },
              { name: 'Anti-Spam', value: 'antiSpam' },
              { name: 'Anti-Link', value: 'antiLink' }
            )
        )
        .addBooleanOption(opt =>
          opt.setName('enabled')
            .setDescription('Enable (true) or Disable (false)')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Configure security log and audit channels')
        .addChannelOption(opt =>
          opt.setName('log_channel')
            .setDescription('Channel where security alerts will be sent')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    await interaction.deferReply();
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let config = await client.db.guildConfig.findUnique({ where: { guildId } });
    if (!config) {
      config = await client.db.guildConfig.create({ data: { guildId } });
    }

    // --- SUBCOMMAND: STATUS ---
    if (subcommand === 'status') {
      const antiRaidStatus = config.antiRaidEnabled ? '🟢 Enabled' : '🔴 Disabled';
      const antiSpamStatus = config.antiSpamEnabled ? '🟢 Enabled' : '🔴 Disabled';
      const antiLinkStatus = config.antiLinkEnabled ? '🟢 Enabled' : '🔴 Disabled';

      const embed = embeds.security(
        'Server Security Status Overview',
        `**Guild ID:** \`${guildId}\`\n\n` +
        `🛡️ **Anti-Raid Protection:** ${antiRaidStatus}\n` +
        `⚡ **Join Threshold:** \`${config.antiRaidThreshold || 10} joins / min\`\n` +
        `💬 **Anti-Spam Monitor:** ${antiSpamStatus}\n` +
        `🔗 **Anti-Link Filter:** ${antiLinkStatus}\n` +
        `🔐 **Verification System:** ${config.verificationChannelId ? `<#${config.verificationChannelId}>` : '`Not Configured`'}\n` +
        `📋 **Security Audit Channel:** ${config.securityChannelId ? `<#${config.securityChannelId}>` : '`Not Set`'}`
      );
      return interaction.editReply({ embeds: [embed] });
    }

    // --- SUBCOMMAND: TOGGLE ---
    if (subcommand === 'toggle') {
      const feature = interaction.options.getString('feature');
      const enabled = interaction.options.getBoolean('enabled');

      const fieldMap = {
        antiRaid: 'antiRaidEnabled',
        antiSpam: 'antiSpamEnabled',
        antiLink: 'antiLinkEnabled'
      };

      await client.db.guildConfig.update({
        where: { guildId },
        data: { [fieldMap[feature]]: enabled }
      });

      const stateStr = enabled ? 'enabled 🟢' : 'disabled 🔴';
      return interaction.editReply({
        embeds: [embeds.success('Security Updated', `**${feature}** has been **${stateStr}** successfully.`)]
      });
    }

    // --- SUBCOMMAND: SETUP ---
    if (subcommand === 'setup') {
      const logChannel = interaction.options.getChannel('log_channel');

      await client.db.guildConfig.update({
        where: { guildId },
        data: { securityChannelId: logChannel.id }
      });

      return interaction.editReply({
        embeds: [embeds.success('Logs Configured', `Security log channel set to ${logChannel}.`)]
      });
    }
  }
};
