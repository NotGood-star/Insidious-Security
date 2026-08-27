const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display detailed statistics and information about this server'),

  async execute(interaction, client) {
    await interaction.deferReply();
    const { guild } = interaction;

    const infoEmbed = embeds.security(
      `${guild.name} — Server Information`,
      `${embeds.emojis.CROWN} **Owner:** <@${guild.ownerId}>\n` +
      `${embeds.emojis.MEMBER} **Total Members:** \`${guild.memberCount}\`\n` +
      `${embeds.emojis.MOD} **Roles:** \`${guild.roles.cache.size}\` | **Channels:** \`${guild.channels.cache.size}\`\n` +
      `${embeds.emojis.CHECK} **Verification Level:** \`${guild.verificationLevel}\`\n` +
      `${embeds.emojis.LOGS} **Created On:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`
    );

    if (guild.iconURL()) infoEmbed.setThumbnail(guild.iconURL({ dynamic: true }));

    return interaction.editReply({ embeds: [infoEmbed] });
  }
};
