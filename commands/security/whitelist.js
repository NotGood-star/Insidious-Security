const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

const OWNER_ID = '1383823552586715197';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelistadd')
    .setDescription('Whitelist a user or role from invite link and mention security triggers')
    .addUserOption(opt => opt.setName('user').setDescription('User to whitelist'))
    .addRoleOption(opt => opt.setName('role').setDescription('Role to whitelist')),

  async execute(interaction, client) {
    if (interaction.user.id !== OWNER_ID && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        embeds: [embeds.error('Access Denied', 'Only server administrators or the bot owner can use this command.')],
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user');
    const targetRole = interaction.options.getRole('role');

    if (!targetUser && !targetRole) {
      return interaction.editReply({
        embeds: [embeds.warning('Invalid Input', 'Please specify either a `@user` or a `@role` to whitelist.')]
      });
    }

    const target = targetUser || targetRole;
    const type = targetUser ? 'USER' : 'ROLE';

    await client.db.whitelist.upsert({
      where: {
        guildId_targetId: {
          guildId: interaction.guild.id,
          targetId: target.id
        }
      },
      update: {},
      create: {
        guildId: interaction.guild.id,
        targetId: target.id,
        type: type
      }
    });

    return interaction.editReply({
      embeds: [embeds.success('Whitelist Updated', `Successfully added ${target} (${type}) to the server security whitelist.`)]
    });
  }
};
