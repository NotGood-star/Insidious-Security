const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot status, API latency, and database connection speed'),

  async execute(interaction, client) {
    const sent = await interaction.deferReply({ fetchReply: true });

    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = client.ws.ping;

    const dbStart = Date.now();
    await client.db.$queryRaw`SELECT 1`.catch(() => {});
    const dbPing = Date.now() - dbStart;

    const pingEmbed = embeds.success(
      'System Diagnostics Status',
      `${embeds.emojis.MOD} **Bot Latency:** \`${roundtrip}ms\`\n` +
      `${embeds.emojis.CROWN} **WebSocket Latency:** \`${wsPing}ms\`\n` +
      `${embeds.emojis.MEMBER} **PostgreSQL Latency:** \`${dbPing}ms\`\n` +
      `${embeds.emojis.WARN} **Uptime:** <t:${Math.floor((Date.now() - client.uptime) / 1000)}:R>`
    );

    return interaction.editReply({ embeds: [pingEmbed] });
  }
};
