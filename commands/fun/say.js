const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

const OWNER_ID = '1383823552586715197';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot send a message')
    .addStringOption(opt => opt.setName('message').setDescription('Message to send').setRequired(true)),

  async execute(interaction) {
    if (interaction.user.id !== OWNER_ID && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ embeds: [embeds.error('Access Denied', 'Manage Messages permission required.')], ephemeral: true });
    }

    const text = interaction.options.getString('message');
    await interaction.reply({ content: 'Message sent!', ephemeral: true });
    
    return interaction.channel.send({ content: text });
  }
};
