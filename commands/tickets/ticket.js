const { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType 
} = require('discord.js');
const embeds = require('../../utils/embeds');

const EMOJI_TICKET = '<a:Tickets:1542907275310801028>';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage the support ticket system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('setup')
        .setDescription('Send the interactive ticket panel to a channel')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Target channel for the panel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    // Defer immediately to prevent 3-second timeout errors
    await interaction.deferReply({ ephemeral: true });

    if (interaction.options.getSubcommand() === 'setup') {
      const targetChannel = interaction.options.getChannel('channel');

      const panelEmbed = embeds.security(
        `${interaction.guild.name} — Support Tickets`,
        `Need help or have a question? Click the button below to open a private support ticket.\n\n` +
        `Our staff team will assist you as soon as possible.`
      );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('Open Ticket')
          .setEmoji(EMOJI_TICKET)
          .setStyle(ButtonStyle.Primary)
      );

      await targetChannel.send({ embeds: [panelEmbed], components: [row] });

      return interaction.editReply({
        embeds: [embeds.security('Ticket System', `Ticket panel successfully sent to ${targetChannel}!`)]
      });
    }
  }
};
