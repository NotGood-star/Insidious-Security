const logger = require('../utils/logger');

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    logger.info(`Bot joined server: ${guild.name} (${guild.id})`);

    try {
      await client.db.guildConfig.upsert({
        where: { guildId: guild.id },
        update: {},
        create: { guildId: guild.id }
      });
      logger.db(`Initialized database record for guild: ${guild.id}`);
    } catch (err) {
      logger.error(`Failed to register guild ${guild.id}:`, err);
    }
  }
};
