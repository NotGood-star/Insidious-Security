const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a random number')
    .addIntegerOption(opt => opt.setName('max').setDescription('Maximum number (default 100)').setMinValue(2)),

  async execute(interaction) {
    await interaction.deferReply();
    const max = interaction.options.getInteger('max') || 100;
    const result = Math.floor(Math.random() * max) + 1;

    const embed = embeds.success(
      'Dice Roll',
      `${embeds.emojis.MOD} You rolled a **${result}** (1 - ${max})!`
    );

    return interaction.editReply({ embeds: [embed] });
  }
};
