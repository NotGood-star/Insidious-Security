const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelistlist')
    .setDescription('View all whitelisted users and roles in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    await interaction.deferReply();

    const list = await client.db.whitelist.findMany({
      where: { guildId: interaction.guild.id }
    });

    if (list.length === 0) {
      return interaction.editReply({
        embeds: [embeds.security(`${interaction.guild.name} Whitelist`, 'No users or roles are currently whitelisted.')]
      });
    }

    const formattedList = list.map((item, index) => {
      const mention = item.type === 'USER' ? `<@${item.targetId}>` : `<@&${item.targetId}>`;
      return `\`${index + 1}.\` ${mention} (${item.type}) - ID: \`${item.targetId}\``;
    }).join('\n');

    const embed = embeds.security(
      `${interaction.guild.name} — Active Whitelist`,
      formattedList
    );

    return interaction.editReply({ embeds: [embed] });
  }
};
