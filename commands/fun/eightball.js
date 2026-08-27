const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

const responses = [
  'It is certain.', 'Without a doubt.', 'You may rely on it.', 'Yes definitely.',
  'As I see it, yes.', 'Most likely.', 'Outlook good.', 'Yes.',
  'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.', 'Cannot predict now.',
  'Don\'t count on it.', 'My reply is no.', 'My sources say no.', 'Outlook not so good.', 'Very doubtful.'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the Magic 8-Ball a question')
    .addStringOption(opt => opt.setName('question').setDescription('Your question').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const question = interaction.options.getString('question');
    const answer = responses[Math.floor(Math.random() * responses.length)];

    const embed = embeds.security(
      'Magic 8-Ball',
      `${embeds.emojis.LOGS} **Question:** ${question}\n` +
      `${embeds.emojis.CHECK} **Answer:** ${answer}`
    );

    return interaction.editReply({ embeds: [embed] });
  }
};
