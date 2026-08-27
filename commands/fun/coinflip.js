const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin!'),

  async execute(interaction) {
    await interaction.deferReply();
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';

    const embed = embeds.success(
      'Coin Flip',
      `${embeds.emojis.CROWN} The coin landed on: **${result}**!`
    );

    return interaction.editReply({ embeds: [embed] });
  }
};
