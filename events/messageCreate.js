const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const logger = require('../utils/logger');

const OWNER_ID = '1383823552586715197';

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // 1. Owner & Admin Bypass
    if (message.author.id === OWNER_ID || message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return;
    }

    try {
      let config = await client.db.guildConfig.findUnique({
        where: { guildId: message.guild.id }
      }).catch(() => null);

      if (!config) {
        config = await client.db.guildConfig.create({
          data: { guildId: message.guild.id }
        }).catch(() => null);
      }

      // 2. Security Whitelist Check
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
          const reason = 'Security Enforcement: Unauthorized Invite Link Shared';
          
          await message.guild.members.ban(message.author.id, { reason });

          // Save action to Database Log
          await client.db.securityLog.create({
            data: {
              guildId: message.guild.id,
              userId: message.author.id,
              action: 'BAN',
              reason: reason
            }
          }).catch(() => {});

          await sendLog(message, client, config?.securityChannelId, `${embeds.emojis.BAN} Instant Ban`, reason);

          const alert = await message.channel.send({
            embeds: [embeds.error('User Banned', `${message.author.tag} was banned for posting server invites.`)]
          });
          setTimeout(() => alert.delete().catch(() => {}), 5000);
        }
        return;
      }

      // --- RULE 2: Mass Mention (@everyone / @here) -> INSTANT KICK ---
      if (message.mentions.everyone || content.includes('@everyone') || content.includes('@here')) {
        await message.delete().catch(() => {});

        if (message.member?.kickable) {
          const reason = 'Security Enforcement: Mass mention (@everyone/@here)';

          await message.member.kick(reason);

          // Save action to Database Log
          await client.db.securityLog.create({
            data: {
              guildId: message.guild.id,
              userId: message.author.id,
              action: 'KICK',
              reason: reason
            }
          }).catch(() => {});

          await sendLog(message, client, config?.securityChannelId, `${embeds.emojis.KICK} Instant Kick`, reason);

          const alert = await message.channel.send({
            embeds: [embeds.error('User Kicked', `${message.author.tag} was kicked for tagging @everyone/@here.`)]
          });
          setTimeout(() => alert.delete().catch(() => {}), 5000);
        }
        return;
      }

      // --- RULE 3: Word Repeated 3+ Times -> 2m TIMEOUT ---
      const cleanText = content.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '');
      const words = cleanText.split(/\s+/).filter(w => w.length > 1);
      
      const counts = {};
      let hasRepeatedSpam = false;
      let targetWord = '';

      for (const word of words) {
        counts[word] = (counts[word] || 0) + 1;
        if (counts[word] > 2) {
          hasRepeatedSpam = true;
          targetWord = word;
          break;
        }
      }

      if (hasRepeatedSpam) {
        await message.delete().catch(() => {});

        if (message.member?.moderatable) {
          const reason = `Repeated word "${targetWord}" 3+ times in a single message`;

          await message.member.timeout(2 * 60 * 1000, reason);

          // Save action to Database Log
          await client.db.securityLog.create({
            data: {
              guildId: message.guild.id,
              userId: message.author.id,
              action: 'TIMEOUT',
              reason: reason
            }
          }).catch(() => {});

          await sendLog(message, client, config?.securityChannelId, `${embeds.emojis.WARN} 2m Timeout`, reason);

          const alert = await message.channel.send({
            embeds: [embeds.warning('User Timed Out', `${message.author} has been timed out for 2 minutes for repeating words.`)]
          });
          setTimeout(() => alert.delete().catch(() => {}), 5000);
        }
        return;
      }

    } catch (err) {
      logger.error('Error in security message handler:', err);
    }
  }
};

async function sendLog(message, client, channelId, title, details) {
  if (!channelId) return;
  const channel = message.guild.channels.cache.get(channelId);
  if (!channel) return;

  const logEmbed = embeds.security(
    `Security Enforcement: ${title}`,
    `**User:** ${message.author.tag} (\`${message.author.id}\`)\n` +
    `**Channel:** ${message.channel}\n` +
    `**Reason:** ${details}\n` +
    `**Message:** \`${message.content.slice(0, 150)}\``
  );

  await channel.send({ embeds: [logEmbed] }).catch(() => {});
          }
