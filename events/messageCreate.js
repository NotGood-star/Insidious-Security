const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const logger = require('../utils/logger');

const OWNER_ID = '1383823552586715197';

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // 1. Owner & Admin Bypass Check
    if (message.author.id === OWNER_ID || message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return;
    }

    try {
      // 2. Fetch or Create Guild Settings safely
      let config = await client.db.guildConfig.findUnique({
        where: { guildId: message.guild.id }
      }).catch(() => null);

      if (!config) {
        config = await client.db.guildConfig.create({
          data: { guildId: message.guild.id }
        }).catch(() => null);
      }

      // 3. Whitelist Check (User or Role)
      const userRoles = message.member?.roles.cache.map(r => r.id) || [];
      const isWhitelisted = await client.db.whitelist.findFirst({
        where: {
          guildId: message.guild.id,
          OR: [
            { targetId: message.author.id },
            { targetId: { in: userRoles } }
          ]
        }
      }).catch(() => null);

      if (isWhitelisted) return;

      const content = message.content;

      // --- RULE 1: Discord Invites & Links -> INSTANT BAN ---
      const linkRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discord(app)?\.com\/invite)\/[a-zA-Z0-9]+/gi;
      
      if (linkRegex.test(content) || (config?.antiLinkEnabled && /(https?:\/\/[^\s]+)/gi.test(content))) {
        await message.delete().catch(() => {});

        if (message.member?.bannable) {
          await message.guild.members.ban(message.author.id, { 
            reason: 'Security Enforcement: Unauthorized Link / Invite Shared' 
          });

          await sendLog(message, client, config?.securityChannelId, '🔨 Instant Ban', 'Posted an unauthorized Discord server invite link.');

          const alert = await message.channel.send({
            embeds: [embeds.error('User Banned', `${message.author.tag} was banned for sharing invite links.`)]
          });
          setTimeout(() => alert.delete().catch(() => {}), 5000);
        }
        return;
      }

      // --- RULE 2: Mass Mention (@everyone / @here) -> INSTANT KICK ---
      if (message.mentions.everyone || content.includes('@everyone') || content.includes('@here')) {
        await message.delete().catch(() => {});

        if (message.member?.kickable) {
          await message.member.kick('Security Enforcement: Mass mention (@everyone/@here)');
          
          await sendLog(message, client, config?.securityChannelId, '👢 Instant Kick', 'Mentioned @everyone or @here.');
          
          const alert = await message.channel.send({
            embeds: [embeds.error('User Kicked', `${message.author.tag} was kicked for tagging @everyone/@here.`)]
          });
          setTimeout(() => alert.delete().catch(() => {}), 5000);
        }
        return;
      }

      // --- RULE 3: Word Repeated More Than 2 Times -> 2m TIMEOUT ---
      const cleanText = content.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '');
      const words = cleanText.split(/\s+/).filter(w => w.length > 1);
      
      const counts = {};
      let hasRepeatedSpam = false;
      let targetWord = '';

      for (const word of words) {
        counts[word] = (counts[word] || 0) + 1;
        if (counts[word] > 2) { // Sent 3 or more times in single message
          hasRepeatedSpam = true;
          targetWord = word;
          break;
        }
      }

      if (hasRepeatedSpam) {
        await message.delete().catch(() => {});

        if (message.member?.moderatable) {
          await message.member.timeout(2 * 60 * 1000, `Repeated word "${targetWord}" 3+ times`);

          await sendLog(message, client, config?.securityChannelId, '⏰ 2m Timeout', `Repeated word "${targetWord}" more than 2 times.`);

          const alert = await message.channel.send({
            embeds: [embeds.warning('User Timed Out', `${message.author} has been timed out for 2 minutes for repeating words.`)]
          });
          setTimeout(() => alert.delete().catch(() => {}), 5000);
        }
        return;
      }

    } catch (err) {
      logger.error('Error in messageCreate event handler:', err);
    }
  }
};

async function sendLog(message, client, channelId, title, details) {
  if (!channelId) return;
  const channel = message.guild.channels.cache.get(channelId);
  if (!channel) return;

  const logEmbed = embeds.security(
    `🛡️ Enforcement: ${title}`,
    `**User:** ${message.author.tag} (\`${message.author.id}\`)\n` +
    `**Channel:** ${message.channel}\n` +
    `**Reason:** ${details}\n` +
    `**Message:** \`${message.content.slice(0, 150)}\``
  );

  await channel.send({ embeds: [logEmbed] }).catch(() => {});
        }
