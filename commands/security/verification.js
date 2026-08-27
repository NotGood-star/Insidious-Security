const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../utils/embeds');

const OWNER_ID = '1383823552586715197';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verification')
    .setDescription('Configure member verification gate')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel where verification panel should be posted')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('role')
        .setDescription('Role to assign upon completing verification')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    if (interaction.user.id !== OWNER_ID && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [embeds.error('Access Denied', 'Admin privileges required.')], ephemeral: true });
    }

    await interaction.deferReply();
    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');

    await client.db.guildConfig.upsert({
      where: { guildId: interaction.guild.id },
      update: { verificationChannelId: channel.id },
      create: { guildId: interaction.guild.id, verificationChannelId: channel.id }
    });

    const verifyEmbed = embeds.security(
      'Member Verification Required',
      `${embeds.emojis.MEMBER} Click the **Verify** button below to complete security verification and enter the server.`
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_user_${role.id}`)
        .setLabel('Verify Member')
        .setStyle(ButtonStyle.Success)
        .setEmoji('1541403131613806602')
    );

    await channel.send({ embeds: [verifyEmbed], components: [row] });

    return interaction.editReply({
      embeds: [embeds.success('Verification Complete', `${embeds.emojis.MOD} Panel posted in ${channel} configured for ${role}.`)]
    });
  }
};
