const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');

const OWNER_ID = '1383823552586715197';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('One-click automatic configuration for Insidious Security')
    .addChannelOption(opt =>
      opt.setName('logchannel')
        .setDescription('Channel to send security audit logs (Creates #security-logs if left empty)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction, client) {
    if (interaction.user.id !== OWNER_ID && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ 
        embeds: [embeds.error('Access Denied', 'Only server administrators or the bot owner can execute full setup.')], 
        ephemeral: true 
      });
    }

    await interaction.deferReply();
    const guild = interaction.guild;
    let targetChannel = interaction.options.getChannel('logchannel');

    // Automatically create a private security log channel if none is supplied
    if (!targetChannel) {
      targetChannel = guild.channels.cache.find(c => c.name === 'security-logs' && c.isTextBased());
      
      if (!targetChannel) {
        targetChannel = await guild.channels.create({
          name: 'security-logs',
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel]
            },
            {
              id: client.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
            }
          ]
        }).catch(() => null);
      }
    }

    if (!targetChannel) {
      return interaction.editReply({
        embeds: [embeds.error('Setup Failed', 'Could not create or access the designated audit log channel. Check bot permissions.')]
      });
    }

    // Save full setup configuration to Database
    await client.db.guildConfig.upsert({
      where: { guildId: guild.id },
      update: {
        securityChannelId: targetChannel.id,
        antiSpamEnabled: true,
        antiLinkEnabled: true,
        antiRaidEnabled: true,
        antiRaidThreshold: 10
      },
      create: {
        guildId: guild.id,
        securityChannelId: targetChannel.id,
        antiSpamEnabled: true,
        antiLinkEnabled: true,
        antiRaidEnabled: true,
        antiRaidThreshold: 10
      }
    });

    const setupSummary = 
      `${embeds.emojis.CHECK} **Audit Log Channel:** ${targetChannel}\n` +
      `${embeds.emojis.CHECK} **Anti-Spam Module:** \`ENABLED\` (3+ repeat word timeout)\n` +
      `${embeds.emojis.CHECK} **Anti-Link Module:** \`ENABLED\` (Unauthorized invite instant ban)\n` +
      `${embeds.emojis.CHECK} **Anti-Raid Protection:** \`ENABLED\` (Limit: 10 joins/min)\n` +
      `${embeds.emojis.CHECK} **Mass Mention Protection:** \`ENABLED\` (@everyone/@here instant kick)\n\n` +
      `${embeds.emojis.CROWN} **Bypass Granted:** <@${OWNER_ID}> (Bot Owner)`;

    return interaction.editReply({
      embeds: [embeds.security('System Setup Complete', setupSummary)]
    });
  }
};
