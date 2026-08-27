const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('../../utils/embeds');

const activeGames = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('2048')
    .setDescription('Play an interactive game of 2048 directly in Discord'),

  async execute(interaction) {
    await interaction.deferReply();

    const gameData = {
      board: createEmptyBoard(),
      score: 0,
      userId: interaction.user.id
    };

    spawnTile(gameData.board);
    spawnTile(gameData.board);

    const gameEmbed = renderBoardEmbed(interaction, gameData);
    const components = getControlButtons(false);

    const response = await interaction.editReply({
      embeds: [gameEmbed],
      components: components
    });

    activeGames.set(response.id, gameData);

    const collector = response.createMessageComponentCollector({
      time: 600000 // 10 minute timeout
    });

    collector.on('collect', async (btnInteraction) => {
      if (btnInteraction.user.id !== gameData.userId) {
        return btnInteraction.reply({
          embeds: [embeds.error('Not Your Game', 'Start your own game using `/2048`.')],
          ephemeral: true
        });
      }

      const direction = btnInteraction.customId.replace('2048_', '');
      let moved = false;

      if (direction === 'up') moved = moveUp(gameData);
      if (direction === 'down') moved = moveDown(gameData);
      if (direction === 'left') moved = moveLeft(gameData);
      if (direction === 'right') moved = moveRight(gameData);

      if (moved) {
        spawnTile(gameData.board);
      }

      const isGameOver = checkGameOver(gameData.board);

      const updatedEmbed = renderBoardEmbed(interaction, gameData, isGameOver);
      const updatedButtons = getControlButtons(isGameOver);

      await btnInteraction.update({
        embeds: [updatedEmbed],
        components: updatedButtons
      });

      if (isGameOver) {
        collector.stop();
        activeGames.delete(response.id);
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = renderBoardEmbed(interaction, gameData, true, 'Game Timed Out');
        await interaction.editReply({
          embeds: [timeoutEmbed],
          components: getControlButtons(true)
        }).catch(() => {});
        activeGames.delete(response.id);
      }
    });
  }
};

// --- HELPER FUNCTIONS ---

function createEmptyBoard() {
  return [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];
}

function spawnTile(board) {
  const emptyCells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) emptyCells.push({ r, c });
    }
  }

  if (emptyCells.length > 0) {
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
}

function renderBoardEmbed(interaction, gameData, gameOver = false, customTitle = null) {
  const tileEmojis = {
    0: '⬛', 2: '🟦', 4: '🟩', 8: '🟧',
    16: '🟥', 32: '🟪', 64: '🟨', 128: '🟫',
    256: '⚪', 512: '🔘', 1024: '🔴', 2048: '🌟'
  };

  let boardStr = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = gameData.board[r][c];
      boardStr += (tileEmojis[val] || '🌟') + ' ';
    }
    boardStr += '\n';
  }

  let textBoard = '```\n';
  for (let r = 0; r < 4; r++) {
    textBoard += gameData.board[r].map(v => String(v).padStart(5, ' ')).join(' |') + '\n';
  }
  textBoard += '```';

  const title = customTitle || (gameOver ? 'Game Over!' : '2048 Game');
  
  return embeds.security(
    `${interaction.guild.name} — ${title}`,
    `${embeds.emojis.CROWN} **Score:** \`${gameData.score}\` | **Player:** ${interaction.user}\n\n` +
    boardStr + '\n' + textBoard
  );
}

function getControlButtons(disabled = false) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('2048_none1').setLabel(' ').setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('2048_up').setEmoji('⬆️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('2048_none2').setLabel(' ').setStyle(ButtonStyle.Secondary).setDisabled(true)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('2048_left').setEmoji('⬅️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('2048_down').setEmoji('⬇️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('2048_right').setEmoji('➡️').setStyle(ButtonStyle.Primary).setDisabled(disabled)
  );

  return [row1, row2];
}

// --- BOARD MOVEMENT LOGIC ---

function moveLeft(gameData) {
  let moved = false;
  for (let r = 0; r < 4; r++) {
    let row = gameData.board[r].filter(val => val !== 0);
    for (let c = 0; c < row.length - 1; c++) {
      if (row[c] === row[c + 1]) {
        row[c] *= 2;
        gameData.score += row[c];
        row[c + 1] = 0;
      }
    }
    row = row.filter(val => val !== 0);
    while (row.length < 4) row.push(0);

    for (let c = 0; c < 4; c++) {
      if (gameData.board[r][c] !== row[c]) moved = true;
      gameData.board[r][c] = row[c];
    }
  }
  return moved;
}

function rotateBoard(board) {
  const newBoard = createEmptyBoard();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      newBoard[c][3 - r] = board[r][c];
    }
  }
  return newBoard;
}

function moveRight(gameData) {
  gameData.board = rotateBoard(rotateBoard(gameData.board));
  const moved = moveLeft(gameData);
  gameData.board = rotateBoard(rotateBoard(gameData.board));
  return moved;
}

function moveUp(gameData) {
  gameData.board = rotateBoard(rotateBoard(rotateBoard(gameData.board)));
  const moved = moveLeft(gameData);
  gameData.board = rotateBoard(gameData.board);
  return moved;
}

function moveDown(gameData) {
  gameData.board = rotateBoard(gameData.board);
  const moved = moveLeft(gameData);
  gameData.board = rotateBoard(rotateBoard(rotateBoard(gameData.board)));
  return moved;
}

function checkGameOver(board) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return false;
      if (c < 3 && board[r][c] === board[r][c + 1]) return false;
      if (r < 3 && board[r][c] === board[r + 1][c]) return false;
    }
  }
  return true;
      }
