const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

const OWNER_ID = '1383823552586715197';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('View security action logs for this server')
    .addUserOption(opt => opt.setName('target').setDescription('Filter logs by target user')),

  async execute(interaction, client) {
    if (interaction.user.id !== OWNER_ID && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [embeds.error('Access Denied', 'Admin privileges required.')], ephemeral: true });
    }

    await interaction.deferReply();
    const targetUser = interaction.options.getUser('target');

    const whereCondition = { guildId: interaction.guild.id };
    if (targetUser) whereCondition.userId = targetUser.id;

    const logs = await client.db.securityLog.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (logs.length === 0) {
      return interaction.editReply({
        embeds: [embeds.audit('Security Audit History', 'No recorded security actions found.')]
      });
    }

    const logList = logs.map((entry, idx) => {
      let icon = embeds.emojis.WARN;
      if (entry.action === 'BAN') icon = embeds.emojis.BAN;
      if (entry.action === 'KICK') icon = embeds.emojis.KICK;

      return `\`${idx + 1}.\` ${icon} **${entry.action}** - <@${entry.userId}>\n` +
             `┗ **Reason:** \`${entry.reason}\` (<t:${Math.floor(entry.createdAt.getTime() / 1000)}:R>)`;
    }).join('\n\n');

    return interaction.editReply({
      embeds: [embeds.audit(`Security Audit Logs ${targetUser ? `for ${targetUser.tag}` : ''}`, logList)]
    });
  }
};
