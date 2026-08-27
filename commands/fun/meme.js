const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Fetch a random meme from Reddit'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const response = await fetch('https://meme-api.com/gimme/memes');
      const data = await response.json();

      if (!data || data.nsfw) {
        return interaction.editReply({ embeds: [embeds.error('Meme Failed', 'Could not fetch a suitable meme right now. Try again!')] });
      }

      const memeEmbed = embeds.security(
        data.title,
        `${embeds.emojis.LOGS} **Subreddit:** r/${data.subreddit} | ${embeds.emojis.CROWN} **Upvotes:** \`${data.ups}\``
      ).setImage(data.url);

      return interaction.editReply({ embeds: [memeEmbed] });
    } catch {
      return interaction.editReply({ embeds: [embeds.error('API Error', 'Failed to communicate with meme service.')] });
    }
  }
};
