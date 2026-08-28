const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionFlagsBits 
} = require('discord.js');
const embeds = require('../utils/embeds');
const fs = require('fs');

const EMOJI_DELETE = '<a:TheCafe_Exclamation:1542907934931943475>';
const EMOJI_TRANSCRIPT = '<a:GeneralSupport:1541400818563948726>';
const EMOJI_CLAIM = '<a:Verify:1538893080315568138>';

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // 1. ROUTE SLASH COMMANDS TO COMMAND HANDLERS
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing slash command ${interaction.commandName}:`, error);
        const replyPayload = { 
          embeds: [embeds.error('Command Error', 'An error occurred while executing this command.')], 
          ephemeral: true 
        };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(replyPayload).catch(() => {});
        } else {
          await interaction.reply(replyPayload).catch(() => {});
        }
      }
      return;
    }

    // 2. OPEN TICKET MODAL ON BUTTON CLICK
    if (interaction.isButton() && interaction.customId === 'create_ticket') {
      const modal = new ModalBuilder()
        .setCustomId('ticket_modal')
        .setTitle('Open a Support Ticket');

      const reasonInput = new TextInputBuilder()
        .setCustomId('ticket_reason')
        .setLabel('Reason for opening this ticket')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Describe your issue or request here...')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
      return interaction.showModal(modal);
    }

    // 3. PROCESS MODAL SUBMISSION TO CREATE CHANNEL
    if (interaction.isModalSubmit() && interaction.customId === 'ticket_modal') {
      await interaction.deferReply({ ephemeral: true });

      const reason = interaction.fields.getTextInputValue('ticket_reason');
      const channelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

      const existingChannel = interaction.guild.channels.cache.find(c => c.name === channelName);
      if (existingChannel) {
        return interaction.editReply({
          embeds: [embeds.warning('Ticket Exists', `You already have an open ticket: ${existingChannel}`)]
        });
      }

      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel, 
              PermissionFlagsBits.SendMessages, 
              PermissionFlagsBits.AttachFiles, 
              PermissionFlagsBits.ReadMessageHistory
            ]
          },
          {
            id: interaction.guild.members.me.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
          }
        ]
      });

      const ticketEmbed = embeds.security(
        `Ticket — ${interaction.user.username}`,
        `Welcome ${interaction.user}!\n\n` +
        `**Reason:**\n\`\`\`${reason}\`\`\`\n` +
        `A staff member will be with you shortly. Use the controls below to manage this ticket.`
      );

      const controlsRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Claim')
          .setEmoji(EMOJI_CLAIM)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('ticket_transcript')
          .setLabel('Transcript')
          .setEmoji(EMOJI_TRANSCRIPT)
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('ticket_delete')
          .setLabel('Delete')
          .setEmoji(EMOJI_DELETE)
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({ content: `${interaction.user}`, embeds: [ticketEmbed], components: [controlsRow] });

      return interaction.editReply({
        embeds: [embeds.security('Ticket Created', `Your ticket has been created: ${ticketChannel}`)]
      });
    }

    // 4. TICKET CONTROLS (CLAIM, TRANSCRIPT, DELETE)
    if (interaction.isButton()) {
      const { customId, channel, user } = interaction;
      if (!customId.startsWith('ticket_') || customId === 'create_ticket') return;

      if (customId === 'ticket_claim') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
          return interaction.reply({ content: 'Only staff can claim tickets.', ephemeral: true });
        }
        return interaction.reply({
          embeds: [embeds.security('Ticket Claimed', `${EMOJI_CLAIM} This ticket is now being handled by ${user}.`)]
        });
      }

      if (customId === 'ticket_transcript') {
        await interaction.deferReply();
        const messages = await channel.messages.fetch({ limit: 100 });
        const log = messages
          .reverse()
          .map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.cleanContent}`)
          .join('\n');

        const filePath = `./transcript-${channel.name}.txt`;
        fs.writeFileSync(filePath, log);

        await interaction.editReply({
          content: `${EMOJI_TRANSCRIPT} Here is your message transcript:`,
          files: [filePath]
        });

        return fs.unlinkSync(filePath);
      }

      if (customId === 'ticket_delete') {
        await interaction.reply({
          embeds: [embeds.warning('Deleting Ticket', `${EMOJI_DELETE} Channel will be deleted in 5 seconds...`)]
        });
        setTimeout(() => channel.delete().catch(() => {}), 5000);
      }
    }
  }
};
