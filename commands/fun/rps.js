const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play Rock, Paper, Scissors against the bot'),

  async execute(interaction) {
    await interaction.deferReply();

    const choices = ['rock', 'paper', 'scissors'];
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rock').setLabel('Rock').setEmoji('🪨').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('paper').setLabel('Paper').setEmoji('📄').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('scissors').setLabel('Scissors').setEmoji('✂️').setStyle(ButtonStyle.Primary)
    );

    const initialEmbed = embeds.security(
      `${interaction.guild.name} — Rock Paper Scissors`,
      `**Player:** ${interaction.user}\n\nSelect your move below to play!`
    );

    const response = await interaction.editReply({
      embeds: [initialEmbed],
      components: [row]
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000
    });

    collector.on('collect', async btn => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: 'Start your own match with `/rps`!', ephemeral: true });
      }

      const playerChoice = btn.customId;
      const botChoice = choices[Math.floor(Math.random() * choices.length)];

      let resultText = '';
      if (playerChoice === botChoice) {
        resultText = "It's a tie!";
      } else if (
        (playerChoice === 'rock' && botChoice === 'scissors') ||
        (playerChoice === 'paper' && botChoice === 'rock') ||
        (playerChoice === 'scissors' && botChoice === 'paper')
      ) {
        resultText = `${embeds.emojis.CHECK} You won!`;
      } else {
        resultText = `${embeds.emojis.CROSS} You lost!`;
      }

      const resultEmbed = embeds.security(
        `${interaction.guild.name} — Match Results`,
        `**You picked:** \`${playerChoice.toUpperCase()}\`\n` +
        `**Bot picked:** \`${botChoice.toUpperCase()}\`\n\n` +
        `**Outcome:** ${resultText}`
      );

      collector.stop();
      return btn.update({ embeds: [resultEmbed], components: [] });
    });

    collector.on('end', (_, reason) => {
      if (reason !== 'user') {
        interaction.editReply({ components: [] }).catch(() => {});
      }
    });
  }
};
