const userMessageCache = new Map();

/**
 * Checks if a user is exceeding message limits
 * @param {import('discord.js').Message} message 
 * @param {Object} guildData 
 * @returns {Promise<boolean>}
 */
async function checkSpam(message, guildData) {
  const userId = message.author.id;
  const now = Date.now();
  const LIMIT = guildData.antiSpamLimit || 5; // Max 5 messages
  const TIME_WINDOW = 5000; // per 5 seconds

  if (!userMessageCache.has(userId)) {
    userMessageCache.set(userId, []);
  }

  const timestamps = userMessageCache.get(userId);
  timestamps.push(now);

  // Filter out timestamps older than the time window
  const recentMessages = timestamps.filter(time => now - time < TIME_WINDOW);
  userMessageCache.set(userId, recentMessages);

  return recentMessages.length > LIMIT;
}

module.exports = { checkSpam };
