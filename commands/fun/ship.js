const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Calculate compatibility between two users')
    .addUserOption(opt => opt.setName('user1').setDescription('First user').setRequired(true))
    .addUserOption(opt => opt.setName('user2').setDescription('Second user').setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();
    const user1 = interaction.options.getUser('user1');
    const user2 = interaction.options.getUser('user2') || interaction.user;

    // Seeded random calculation based on user IDs for consistent results
    const combinedId = BigInt(user1.id) + BigInt(user2.id);
    const percentage = Number(combinedId % 101n);

    let status = 'Not a match...';
    if (percentage > 75) status = 'A match made in heaven!';
    else if (percentage > 50) status = 'Good potential!';
    else if (percentage > 25) status = 'Could be worse!';

    const embed = embeds.security(
      'Love Calculator',
      `${embeds.emojis.MEMBER} **${user1.username}** x **${user2.username}**\n\n` +
      `${embeds.emojis.CROWN} **Rating:** \`${percentage}%\`\n` +
      `${embeds.emojis.CHECK} **Status:** ${status}`
    );

    return interaction.editReply({ embeds: [embed] });
  }
};
