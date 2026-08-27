const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

const OWNER_ID = '1383823552586715197';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('security')
    .setDescription('Manage server security protection modules')
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('View current status of all security modules')
    )
    .addSubcommand(sub =>
      sub.setName('toggle')
        .setDescription('Enable or disable a security module')
        .addStringOption(opt =>
          opt.setName('module')
            .setDescription('Security module to configure')
            .setRequired(true)
            .addChoices(
              { name: 'Anti-Spam', value: 'antiSpamEnabled' },
              { name: 'Anti-Link', value: 'antiLinkEnabled' },
              { name: 'Anti-Raid', value: 'antiRaidEnabled' }
            )
        )
        .addBooleanOption(opt =>
          opt.setName('state')
            .setDescription('Enable (True) or Disable (False)')
            .setRequired(true)
        )
    ),

  async execute(interaction, client) {
    if (interaction.user.id !== OWNER_ID && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [embeds.error('Access Denied', 'Admin privileges required.')], ephemeral: true });
    }

    await interaction.deferReply();
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let config = await client.db.guildConfig.findUnique({ where: { guildId } });
    if (!config) {
      config = await client.db.guildConfig.create({ data: { guildId } });
    }

    if (subcommand === 'status') {
      const getIcon = (state) => state ? embeds.emojis.CHECK : embeds.emojis.CROSS;

      const description = 
        `${getIcon(config.antiSpamEnabled)} **Anti-Spam Filter:** \`${config.antiSpamEnabled ? 'ENABLED' : 'DISABLED'}\`\n` +
        `${getIcon(config.antiLinkEnabled)} **Anti-Link Filter:** \`${config.antiLinkEnabled ? 'ENABLED' : 'DISABLED'}\`\n` +
        `${getIcon(config.antiRaidEnabled)} **Anti-Raid Protection:** \`${config.antiRaidEnabled ? 'ENABLED' : 'DISABLED'}\` (Limit: \`${config.antiRaidThreshold}/min\`)\n\n` +
        `${embeds.emojis.LOGS} **Log Channel:** ${config.securityChannelId ? `<#${config.securityChannelId}>` : '`Not Configured`'}`;

      return interaction.editReply({
        embeds: [embeds.security(`${interaction.guild.name} — Security Dashboard`, description)]
      });
    }

    if (subcommand === 'toggle') {
      const moduleKey = interaction.options.getString('module');
      const state = interaction.options.getBoolean('state');

      await client.db.guildConfig.update({
        where: { guildId },
        data: { [moduleKey]: state }
      });

      const moduleName = moduleKey.replace('Enabled', '').toUpperCase();
      const statusIcon = state ? embeds.emojis.CHECK : embeds.emojis.CROSS;

      return interaction.editReply({
        embeds: [embeds.success('Security Module Updated', `${statusIcon} **${moduleName}** protection set to **${state ? 'ENABLED' : 'DISABLED'}** for ${interaction.guild.name}.`)]
      });
    }
  }
};
