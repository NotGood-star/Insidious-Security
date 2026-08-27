const embeds = require('../utils/embeds');

// Track join timestamps per guild: Map<GuildID, Array<Timestamp>>
const joinTracker = new Map();

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const guild = member.guild;
    const now = Date.now();

    const config = await client.db.guildConfig.findUnique({
      where: { guildId: guild.id }
    }).catch(() => null);

    // --- ANTI-RAID DETECTION ---
    if (config?.antiRaidEnabled) {
      if (!joinTracker.has(guild.id)) joinTracker.set(guild.id, []);
      const joins = joinTracker.get(guild.id);
      joins.push(now);

      // Keep joins from the last 60 seconds
      const recentJoins = joins.filter(t => now - t < 60000);
      joinTracker.set(guild.id, recentJoins);

      const threshold = config.antiRaidThreshold || 10;
      if (recentJoins.length >= threshold) {
        // Auto-lockdown text channels
        const channels = guild.channels.cache.filter(c => c.isTextBased());
        for (const [_, ch] of channels) {
          await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => {});
        }

        if (config.securityChannelId) {
          const logChannel = guild.channels.cache.get(config.securityChannelId);
          if (logChannel) {
            await logChannel.send({
              embeds: [embeds.error('🚨 RAID DETECTED - AUTOMATIC LOCKDOWN', `Detected **${recentJoins.length} joins in 60s** (Threshold: ${threshold}).\n\nChannels have been locked down. Use \`/antiraid lockdown state:False\` to unlock.`)]
            }).catch(() => {});
          }
        }
      }
    }

    // --- MEMBER JOIN LOGGING ---
    if (config?.securityChannelId) {
      const logChannel = guild.channels.cache.get(config.securityChannelId);
      if (logChannel) {
        const joinEmbed = embeds.security(
          '📥 Member Joined',
          `**User:** ${member.user.tag} (\`${member.id}\`)\n` +
          `**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n` +
          `**Total Members:** \`${guild.memberCount}\``
        );
        await logChannel.send({ embeds: [joinEmbed] }).catch(() => {});
      }
    }
  }
};
