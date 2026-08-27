const embeds = require('../utils/embeds');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild || message.author?.bot) return;

    const config = await client.db.guildConfig.findUnique({
      where: { guildId: message.guild.id }
    }).catch(() => null);

    if (!config?.securityChannelId) return;

    const logChannel = message.guild.channels.cache.get(config.securityChannelId);
    if (!logChannel) return;

    const deleteEmbed = embeds.warning(
      '🗑️ Message Deleted',
      `**Author:** ${message.author?.tag || 'Unknown'} (\`${message.author?.id || 'N/A'}\`)\n` +
      `**Channel:** ${message.channel}\n` +
      `**Content:** \`${message.content?.slice(0, 500) || 'Attachment or Embed'}\``
    );

    await logChannel.send({ embeds: [deleteEmbed] }).catch(() => {});
  }
};
