require('dotenv').config();
const http = require('http');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { PrismaClient } = require('@prisma/client');

const logger = require('./utils/logger');
const embeds = require('./utils/embeds');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');

// 1. Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// 2. Database Connection
client.db = new PrismaClient();

// 3. Setup Audio Player (DisTube)
client.distube = new DisTube(client, {
  emitNewSongOnly: true,
  nsfw: false,
  plugins: [new YtDlpPlugin()]
});

// Audio Event Handlers
client.distube
  .on('playSong', (queue, song) => {
    logger.music(`Playing ${song.name} in ${queue.textChannel.guild.name}`);
  })
  .on('addSong', (queue, song) => {
    logger.music(`Queued ${song.name}`);
  })
  .on('error', (channel, error) => {
    logger.error('DisTube Engine Error:', error);
    if (channel) {
      channel.send({
        embeds: [embeds.error('Music Player Error', `An error occurred: \`${error.message.slice(0, 1900)}\``)]
      }).catch(() => {});
    }
  });

// 4. Global Interactive Music Controls
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith('music_')) return;

  const queue = client.distube.getQueue(interaction);
  if (!queue) {
    return interaction.reply({
      embeds: [embeds.error('Player Inactive', 'No active music stream found.')],
      ephemeral: true
    });
  }

  if (interaction.member.voice.channelId !== queue.voiceChannel.id) {
    return interaction.reply({
      embeds: [embeds.warning('Voice Channel Lock', 'You must be in the same voice channel as the bot.')],
      ephemeral: true
    });
  }

  try {
    switch (interaction.customId) {
      case 'music_pause':
        if (queue.paused) {
          queue.resume();
          await interaction.reply({ embeds: [embeds.music('Resumed', 'Playback resumed.')], ephemeral: true });
        } else {
          queue.pause();
          await interaction.reply({ embeds: [embeds.music('Paused', 'Playback paused.')], ephemeral: true });
        }
        break;
      case 'music_skip':
        await queue.skip();
        await interaction.reply({ embeds: [embeds.music('Skipped', 'Skipped to next track.')], ephemeral: true });
        break;
      case 'music_stop':
        queue.stop();
        await interaction.reply({ embeds: [embeds.music('Stopped', 'Playback stopped and queue cleared.')], ephemeral: true });
        break;
    }
  } catch (e) {
    await interaction.reply({ embeds: [embeds.error('Action Failed', e.message)], ephemeral: true }).catch(() => {});
  }
});

// 5. Render Health Check HTTP Server (Prevents Render Web Service Timeout)
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Insidious Security Bot is active and healthy!');
}).listen(PORT, () => {
  logger.info(`Web server listening on port ${PORT} (Satisfies Render Web Service port check)`);
});

// 6. Application Bootstrap Function
(async () => {
  try {
    await client.db.$connect();
    logger.db('Database client verified.');

    eventHandler(client);
    await client.login(process.env.TOKEN);
    await commandHandler(client);
  } catch (error) {
    logger.error('Fatal initialization error:', error);
    process.exit(1);
  }
})();

// 7. Global Exception Guards
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});
