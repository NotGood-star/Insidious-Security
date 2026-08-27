const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

const OWNER_ID = '1383823552586715197';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelistremove')
    .setDescription('Remove a user or role from the security whitelist')
    .addUserOption(opt => opt.setName('user').setDescription('User to remove'))
    .addRoleOption(opt => opt.setName('role').setDescription('Role to remove')),

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
        embeds: [embeds.warning('Invalid Input', 'Please specify either a `@user` or a `@role` to remove.')]
      });
    }

    const target = targetUser || targetRole;

    const existing = await client.db.whitelist.findUnique({
      where: {
        guildId_targetId: {
          guildId: interaction.guild.id,
          targetId: target.id
        }
      }
    });

    if (!existing) {
      return interaction.editReply({
        embeds: [embeds.error('Not Found', `${target} is not currently in the whitelist.`)]
      });
    }

    await client.db.whitelist.delete({
      where: {
        guildId_targetId: {
          guildId: interaction.guild.id,
          targetId: target.id
        }
      }
    });

    return interaction.editReply({
      embeds: [embeds.success('Whitelist Updated', `Successfully removed ${target} from the security whitelist.`)]
    });
  }
};
