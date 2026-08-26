const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

const OWNER_ID = '1383823552586715197';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Configure anti-raid protection settings')
    .addSubcommand(sub =>
      sub.setName('config')
        .setDescription('Set join limit threshold')
        .addIntegerOption(opt =>
          opt.setName('limit')
            .setDescription('Max joins allowed per minute before triggering anti-raid')
            .setRequired(true)
            .setMinValue(3)
            .setMaxValue(50)
        )
    )
    .addSubcommand(sub =>
      sub.setName('lockdown')
        .setDescription('Manually lock down or unlock channel text permissions')
        .addBooleanOption(opt =>
          opt.setName('state')
            .setDescription('True to lock down server channels, False to unlock')
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

    if (subcommand === 'config') {
      const limit = interaction.options.getInteger('limit');
      await client.db.guildConfig.upsert({
        where: { guildId },
        update: { antiRaidThreshold: limit },
        create: { guildId, antiRaidThreshold: limit }
      });

      return interaction.editReply({
        embeds: [embeds.success('Anti-Raid Configured', `Join threshold set to **${limit} joins / minute**.`)]
      });
    }

    if (subcommand === 'lockdown') {
      const state = interaction.options.getBoolean('state');
      const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());

      for (const [_, channel] of channels) {
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          SendMessages: !state
        }).catch(() => {});
      }

      const statusMsg = state ? '🔒 **Server Locked Down**: Sending messages restricted for @everyone.' : '🔓 **Lockdown Lifted**: Channel permissions restored.';
      return interaction.editReply({ embeds: [embeds.security('Lockdown Status', statusMsg)] });
    }
  }
};
