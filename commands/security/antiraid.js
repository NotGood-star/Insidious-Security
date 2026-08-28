const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Configure Anti-Raid protection settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('status')
        .setDescription('Enable or disable Anti-Raid')
        .setRequired(true)
        .addChoices(
          { name: 'Enable', value: 'enable' },
          { name: 'Disable', value: 'disable' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const status = interaction.options.getString('status');
    const isEnabled = status === 'enable';

    // Save directly to DB safely
    try {
      // Replace with your DB update call
      // await db.guilds.update({ id: interaction.guild.id }, { antiRaid: isEnabled });

      const responseEmbed = embeds.security(
        `${interaction.guild.name} — Anti-Raid Configuration`,
        `Anti-Raid protection has been successfully **${isEnabled ? 'ENABLED' : 'DISABLED'}**.`
      );

      return interaction.editReply({ embeds: [responseEmbed] });
    } catch (err) {
      console.error(err);
      return interaction.editReply({ 
        embeds: [embeds.error('Command Error', 'Failed to update anti-raid security settings.')] 
      });
    }
  }
};
