const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

const OWNER_ID = '1383823552586715197';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation commands')
    .addSubcommand(sub =>
      sub.setName('kick')
        .setDescription('Kick a user')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
    )
    .addSubcommand(sub =>
      sub.setName('ban')
        .setDescription('Ban a user')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
    )
    .addSubcommand(sub =>
      sub.setName('purge')
        .setDescription('Bulk delete messages')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    ),

  async execute(interaction, client) {
    if (interaction.user.id !== OWNER_ID && !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ embeds: [embeds.error('Access Denied', 'Moderator privileges required.')], ephemeral: true });
    }

    await interaction.deferReply();
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'kick') {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);

      if (!member || !member.kickable) return interaction.editReply({ embeds: [embeds.error('Failed', 'Cannot kick this user.')] });
      await member.kick(reason);
      return interaction.editReply({ embeds: [embeds.success('User Kicked', `${user.tag} has been kicked.\nReason: ${reason}`)] });
    }

    if (subcommand === 'ban') {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      await interaction.guild.members.ban(user.id, { reason }).catch(() => null);
      return interaction.editReply({ embeds: [embeds.success('User Banned', `${user.tag} has been banned.\nReason: ${reason}`)] });
    }

    if (subcommand === 'purge') {
      const amount = interaction.options.getInteger('amount');
      const deleted = await interaction.channel.bulkDelete(amount, true).catch(() => null);
      return interaction.editReply({ embeds: [embeds.success('Messages Purged', `Deleted ${deleted ? deleted.size : 0} messages.`)] });
    }
  }
};
