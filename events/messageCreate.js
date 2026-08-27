const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const logger = require('../utils/logger');

const OWNER_ID = '1383823552586715197';

// Allowed media and meme domains that will NOT trigger a link mute
const ALLOWED_DOMAINS = [
  'tenor.com',
  'giphy.com',
  'imgur.com',
  'youtube.com',
  'youtu.be',
  'cdn.discordapp.com',
  'media.discordapp.net'
];

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

      // --- RULE 1: @everyone / @here -> INSTANT BAN ---
      if (message.mentions.everyone || content.includes('@everyone') || content.includes('@here')) {
        await message.delete().catch(() => {});

        if (message.member?.bannable) {
          const reason = 'Security Enforcement: Unauthorized Mass Mention (@everyone / @here)';
          
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
            embeds: [embeds.error('User Banned', `${message.author.tag} was banned for tagging @everyone / @here.`)]
          });
          setTimeout(() => alert.delete().catch(() => {}), 5000);
        }
        return;
      }

      // --- RULE 2: External Links -> 30m TIMEOUT / MUTE (Excludes Meme & Media Links) ---
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const links = content.match(urlRegex);

      if (links && links.length > 0) {
        // Check if any detected link falls outside allowed domains
        const isUnauthorizedLink = links.some(link => {
          const lowerLink = link.toLowerCase();
          return !ALLOWED_DOMAINS.some(domain => lowerLink.includes(domain));
        });

        if (isUnauthorizedLink) {
          await message.delete().catch(() => {});

          if (message.member?.moderatable) {
            const durationMs = 30 * 60 * 1000; // 30 Minutes
            const reason = 'Security Enforcement: Posted unauthorized external link';

            await message.member.timeout(durationMs, reason);

            // Save action to Database Log
            await client.db.securityLog.create({
              data: {
                guildId: message.guild.id,
                userId: message.author.id,
                action: 'TIMEOUT',
                reason: reason
              }
            }).catch(() => {});

            await sendLog(message, client, config?.securityChannelId, `${embeds.emojis.WARN} 30m Timeout`, reason);

            const alert = await message.channel.send({
              embeds: [embeds.warning('User Muted', `${message.author} has been timed out for 30 minutes for posting links.`)]
            });
            setTimeout(() => alert.delete().catch(() => {}), 5000);
          }
          return;
        }
      }

      // --- RULE 3: Word Repeated More Than 2 Times -> 2m TIMEOUT ---
      const cleanText = content.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '');
      const words = cleanText.split(/\s+/).filter(w => w.length > 1);
      
      const counts = {};
      let hasRepeatedSpam = false;
      let targetWord = '';

      for (const word of words) {
        counts[word] = (counts[word] || 0) + 1;
        if (counts[word] > 2) { // Sent 3 or more times in a single message
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
