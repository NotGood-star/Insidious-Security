const logger = require('../utils/logger');
const embeds = require('../utils/embeds');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // --- 1. SLASH COMMAND HANDLER ---
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`No command matching /${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        logger.error(`Error executing command /${interaction.commandName}:`, error);

        const errorEmbed = embeds.error(
          'Command Error',
          'An unexpected error occurred while executing this command.'
        );

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
        }
      }
      return;
    }

    // --- 2. BUTTON INTERACTION HANDLER (VERIFICATION & SYSTEM) ---
    if (interaction.isButton()) {
      // Handle Verification Panel Buttons
      if (interaction.customId.startsWith('verify_user_')) {
        const roleId = interaction.customId.replace('verify_user_', '');
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
          return interaction.reply({
            embeds: [embeds.error('Verification Failed', 'The configured verification role no longer exists in this server.')],
            ephemeral: true
          });
        }

        try {
          // Check if user already has the role
          if (interaction.member.roles.cache.has(roleId)) {
            return interaction.reply({
              embeds: [embeds.warning('Already Verified', 'You are already verified in this server!')],
              ephemeral: true
            });
          }

          // Assign verification role
          await interaction.member.roles.add(role);
          return interaction.reply({
            embeds: [embeds.success('Access Granted', `You have been successfully verified and granted the **${role.name}** role!`)],
            ephemeral: true
          });
        } catch (err) {
          logger.error('Failed to assign verification role:', err);
          return interaction.reply({
            embeds: [embeds.error('Role Error', 'I do not have high enough permissions to assign this role. Please contact an admin.')],
            ephemeral: true
          });
        }
      }
      return;
    }

    // --- 3. AUTOCOMPLETE HANDLER (IF NEEDED FOR FUTURE COMMANDS) ---
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;

      try {
        await command.autocomplete(interaction, client);
      } catch (error) {
        logger.error(`Autocomplete error for /${interaction.commandName}:`, error);
      }
    }
  }
};
