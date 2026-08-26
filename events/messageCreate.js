const { PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const logger = require('../utils/logger');

// Hardcoded Owner ID with ultimate bypass authority
const OWNER_ID = '1383823552586715197';

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // 1. Ultimate Bypass Check for Bot Owner & Server Admins
    if (message.author.id === OWNER_ID || message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      return;
    }

    try {
      const config = await client.db.guildConfig.findUnique({
        where: { guildId: message.guild.id }
      });

      // 2. Check Whitelist Table in DB (Role or User)
      const userWhitelisted = await client.db.whitelist.findFirst({
        where: {
          guildId: message.guild.id,
          OR: [
            { targetId: message.author.id },
            { targetId: { in: message.member?.roles.cache.map(r => r.id) || [] } }
          ]
        }
      });

      if (userWhitelisted) return;

      const content = message.content;

      // --- RULE 1: @everyone / @here -> INSTANT KICK ---
      if (message.mentions.everyone || content.includes('@everyone') || content.includes('@here')) {
        await message.delete().catch(() => {});

        if (message.member?.kickable) {
          await message.member.kick('Security Trigger: Mass mention (@everyone/@here)');
          
          await sendLog(message, client, config?.securityChannelId, '👢 Instant Kick', 'Mentioned @everyone or @here without authorization.');
          
          const alert = await message.channel.send({
            embeds: [embeds.error('User Kicked', `${message.author.tag} was kicked for tagging @everyone/@here.`)]
          });
          setTimeout(() => alert.delete().catch(() => {}), 5000);
        }
        return;
      }

      // --- RULE 2: Discord Invite Link -> INSTANT BAN ---
      const inviteRegex = /(discord\.(gg|io|me|li)|discord(app)?\.com\/invite)\/[a-zA-Z0-9]+/gi;
      if (inviteRegex.test(content)) {
        await message.delete().catch(() => {});

        if (message.member?.bannable) {
          await message.guild.members.ban(message.author.id, { reason: 'Security Trigger: Unauthorized Invite Link' });

          await sendLog(message, client, config?.securityChannelId, '🔨 Instant Ban', 'Posted an unauthorized Discord server invite link.');

          const alert = await message.channel.send({
            embeds: [embeds.error('User Banned', `${message.author.tag} was banned for posting server invites.`)]
          });
          setTimeout(() => alert.delete().catch(() => {}), 5000);
        }
        return;
      }

      // --- RULE 3: Word Repeated More Than 2 Times -> 2m TIMEOUT ---
      const words = content.toLowerCase().split(/\s+/);
      const wordCounts = {};
      let maxRepeatCount = 0;
      let repeatedWord = '';

      for (const word of words) {
        if (word.length < 2) continue; // Ignore single character noise
        wordCounts[word] = (wordCounts[word] || 0) + 1;
        if (wordCounts[word] > maxRepeatCount) {
          maxRepeatCount = wordCounts[word];
          repeatedWord = word;
        }
      }

      if (maxRepeatCount > 2) { // Repeated 3 or more times
        await message.delete().catch(() => {});

        if (message.member?.moderatable) {
          await message.member.timeout(2 * 60 * 1000, `Repeated word "${repeatedWord}" ${maxRepeatCount} times`);

          await sendLog(message, client, config?.securityChannelId, '⏰ 2m Timeout', `Repeated word "${repeatedWord}" ${maxRepeatCount} times.`);

          const alert = await message.channel.send({
            embeds: [embeds.warning('User Timed Out', `${message.author} has been timed out for 2 minutes for repeating words.`)]
          });
          setTimeout(() => alert.delete().catch(() => {}), 5000);
        }
        return;
      }

    } catch (err) {
      logger.error('Error in security message enforcement:', err);
    }
  }
};

async function sendLog(message, client, channelId, title, details) {
  if (!channelId) return;
  const channel = message.guild.channels.cache.get(channelId);
  if (!channel) return;

  const logEmbed = embeds.security(
    `🛡️ Security Enforcement: ${title}`,
    `**User:** ${message.author.tag} (\`${message.author.id}\`)\n` +
    `**Channel:** ${message.channel}\n` +
    `**Reason:** ${details}\n` +
    `**Content:** \`${message.content.slice(0, 200)}\``
  );

  await channel.send({ embeds: [logEmbed] }).catch(() => {});
        }
