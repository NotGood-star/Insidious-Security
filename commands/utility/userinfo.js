const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Display information about a user')
    .addUserOption(opt => opt.setName('target').setDescription('User to inspect')),

  async execute(interaction, client) {
    await interaction.deferReply();
    const user = interaction.options.getUser('target') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const userEmbed = embeds.security(
      `${user.tag} User Profile`,
      `${embeds.emojis.MEMBER} **User Mention:** ${user}\n` +
      `${embeds.emojis.MOD} **User ID:** \`${user.id}\`\n` +
      `${embeds.emojis.CHECK} **Account Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>\n` +
      (member ? `${embeds.emojis.LOGS} **Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\n` : '') +
      (member ? `${embeds.emojis.CROWN} **Highest Role:** ${member.roles.highest}` : '')
    );

    userEmbed.setThumbnail(user.displayAvatarURL({ dynamic: true }));

    return interaction.editReply({ embeds: [userEmbed] });
  }
};
