const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Display a user's avatar in full resolution")
    .addUserOption(opt => opt.setName('target').setDescription('Target user')),

  async execute(interaction, client) {
    await interaction.deferReply();
    const user = interaction.options.getUser('target') || interaction.user;
    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

    const avatarEmbed = embeds.security(
      `${user.username}'s Avatar`,
      `${embeds.emojis.MEMBER} [Click here to open image in full resolution](${avatarUrl})`
    ).setImage(avatarUrl);

    return interaction.editReply({ embeds: [avatarEmbed] });
  }
};
