const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const logger = require('./logger');

module.exports = async function loadCommands(client) {
  client.commands = new Map();
  const commandsArray = [];
  const commandsPath = path.join(__dirname, '../commands');

  // Helper function to recursively traverse subfolders
  function readCommandsRecursively(directory) {
    if (!fs.existsSync(directory)) return;

    const files = fs.readdirSync(directory, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(directory, file.name);

      if (file.isDirectory()) {
        readCommandsRecursively(fullPath);
      } else if (file.name.endsWith('.js')) {
        // Clear require cache to ensure clean reloads on restarts
        delete require.cache[require.resolve(fullPath)];
        
        const command = require(fullPath);

        if (command && 'data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          commandsArray.push(command.data.toJSON());
        } else {
          logger.warn(`[COMMAND LOADER] Skipping ${file.name}: Missing "data" or "execute" export.`);
        }
      }
    }
  }

  // Load all commands from commands/ and its subfolders
  readCommandsRecursively(commandsPath);

  // Push slash commands to Discord Application REST API
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    logger.info(`🤖 [INFO] Refreshing ${commandsArray.length} application (/) commands.`);

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commandsArray }
    );

    logger.success(`📦 [SUCCESS] Registered ${commandsArray.length} application (/) commands.`);
  } catch (error) {
    logger.error('❌ [ERROR] Failed to register application commands with Discord API:', error);
  }
};
