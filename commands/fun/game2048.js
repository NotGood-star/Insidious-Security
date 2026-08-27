const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const embeds = require('../../utils/embeds');

// Visual tile mapping using emojis
const TILE_EMOJIS = {
  0: '⬛',
  2: '2️⃣',
  4: '4️⃣',
  8: '8️⃣',
  16: '🟧',
  32: '🟥',
  64: '🟪',
  128: '🟦',
  256: '🟩',
  512: '🟨',
  1024: '🌟',
  2048: '👑'
};

function renderBoard(board) {
  return board.map(row => row.map(val => TILE_EMOJIS[val] || `\`[${val}]\``).join(' ')).join('\n');
}

function spawnTile(board) {
  const empty = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) empty.push({ r, c });
    }
  }
  if (empty.length > 0) {
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
}

function slide(row) {
  let arr = row.filter(val => val !== 0);
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      arr[i + 1] = 0;
    }
  }
  arr = arr.filter(val => val !== 0);
  while (arr.length < 4) arr.push(0);
  return arr;
}

function rotateLeft(board) {
  const result = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      result[3 - c][r] = board[r][c];
    }
  }
  return result;
}

function move(board, direction) {
  let rotated = [...board.map(r => [...r])];
  let rotations = 0;

  if (direction === 'up') rotations = 3;
  else if (direction === 'right') rotations = 2;
  else if (direction === 'down') rotations = 1;

  for (let i = 0; i < rotations; i++) rotated = rotateLeft(rotated);

  for (let r = 0; r < 4; r++) rotated[r] = slide(rotated[r]);

  for (let i = 0; i < (4 - rotations) % 4; i++) rotated = rotateLeft(rotated);

  return rotated;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('2048')
    .setDescription('Play an interactive game of 2048'),

  async execute(interaction) {
    await interaction.deferReply();

    let board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];

    spawnTile(board);
    spawnTile(board);

    const getRows = () => [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('up').setEmoji('⬆️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('left').setEmoji('⬅️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('right').setEmoji('➡️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('down').setEmoji('⬇️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('stop').setEmoji('🛑').setStyle(ButtonStyle.Danger)
      )
    ];

    const gameEmbed = embeds.security(
      `${interaction.guild.name} — 2048`,
      `**Player:** ${interaction.user}\n\n${renderBoard(board)}`
    );

    const response = await interaction.editReply({
      embeds: [gameEmbed],
      components: getRows()
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000 // 5 Minutes idle timeout
    });

    collector.on('collect', async btn => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: 'Start your own game with `/2048`!', ephemeral: true });
      }

      if (btn.customId === 'stop') {
        collector.stop('stopped');
        return btn.update({
          embeds: [embeds.warning('Game Ended', `You ended your 2048 game session.\n\n${renderBoard(board)}`)].map(e => e.setFooter({ text: 'Insidious Global Security' })),
          components: []
        });
      }

      const newBoard = move(board, btn.customId);
      if (JSON.stringify(newBoard) !== JSON.stringify(board)) {
        board = newBoard;
        spawnTile(board);
      }

      const updatedEmbed = embeds.security(
        `${interaction.guild.name} — 2048`,
        `**Player:** ${interaction.user}\n\n${renderBoard(board)}`
      );

      await btn.update({ embeds: [updatedEmbed], components: getRows() });
    });

    collector.on('end', (_, reason) => {
      if (reason !== 'stopped') {
        interaction.editReply({ 
          components: [],
          embeds: [embeds.warning('Game Timed Out', `Session expired due to inactivity.\n\n${renderBoard(board)}`)].map(e => e.setFooter({ text: 'Insidious Global Security' }))
        }).catch(() => {});
      }
    });
  }
};
