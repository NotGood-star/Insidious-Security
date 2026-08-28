const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const embeds = require('../../utils/embeds');

const QUESTION_EMOJI = '<a:QuestionMark:1541402531740262450>';

const QUESTIONS = [
  {
    q: 'What type of attack involves overwhelming a server with traffic?',
    options: ['Phishing', 'DDoS', 'SQL Injection', 'Man-in-the-Middle'],
    answer: 'DDoS'
  },
  {
    q: 'Which database is used by this bot for persistent security configuration?',
    options: ['MongoDB', 'SQLite', 'PostgreSQL', 'Redis'],
    answer: 'PostgreSQL'
  },
  {
    q: 'What is the default threshold for our Anti-Raid detection per minute?',
    options: ['5 joins', '10 joins', '20 joins', '50 joins'],
    answer: '10 joins'
  }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Answer a quick tech & security trivia question'),

  async execute(interaction) {
    await interaction.deferReply();

    const trivia = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const row = new ActionRowBuilder();

    trivia.options.forEach((opt, idx) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`trivia_${idx}`)
          .setLabel(opt)
          .setStyle(ButtonStyle.Primary)
      );
    });

    const triviaEmbed = embeds.security(
      `${interaction.guild.name} — Trivia Challenge`,
      `${QUESTION_EMOJI} **Question:**\n${trivia.q}`
    );

    const response = await interaction.editReply({
      embeds: [triviaEmbed],
      components: [row]
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000
    });

    collector.on('collect', async btn => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: 'Start your own trivia with `/trivia`!', ephemeral: true });
      }

      await btn.deferUpdate();

      const selectedOpt = btn.component.label;
      const isCorrect = selectedOpt === trivia.answer;

      const resultEmbed = embeds.security(
        `${interaction.guild.name} — Trivia Result`,
        `${QUESTION_EMOJI} **Question:** ${trivia.q}\n\n` +
        `**Your Answer:** \`${selectedOpt}\`\n` +
        `**Correct Answer:** \`${trivia.answer}\`\n\n` +
        (isCorrect ? `${embeds.emojis.CHECK} **Correct! Great job.**` : `${embeds.emojis.CROSS} **Wrong answer!**`)
      );

      collector.stop();
      return interaction.editReply({ embeds: [resultEmbed], components: [] });
    });

    collector.on('end', (_, reason) => {
      if (reason !== 'user') {
        interaction.editReply({ components: [] }).catch(() => {});
      }
    });
  }
};
