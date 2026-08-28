const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const embeds = require('../../utils/embeds');

const EMOJI_X = '<a:Animated_Cross:1542741543067066378>';
const EMOJI_O = '<:__:1542745217869029377>';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tictactoe')
    .setDescription('Challenge another user to Tic-Tac-Toe')
    .addUserOption(opt => opt.setName('opponent').setDescription('User to challenge').setRequired(true)),

  async execute(interaction) {
    const opponent = interaction.options.getUser('opponent');

    if (opponent.bot || opponent.id === interaction.user.id) {
      return interaction.reply({ 
        embeds: [embeds.error('Invalid Opponent', 'You cannot play against yourself or bots.')], 
        ephemeral: true 
      });
    }

    await interaction.deferReply();

    let board = Array(9).fill(null);
    let turn = interaction.user.id;

    const renderRows = (disabled = false) => {
      const rows = [];
      for (let i = 0; i < 3; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
          const index = i * 3 + j;
          const btn = new ButtonBuilder()
            .setCustomId(`cell_${index}`)
            .setStyle(board[index] ? ButtonStyle.Secondary : ButtonStyle.Primary)
            .setDisabled(disabled || board[index] !== null);

          if (board[index] === 'X') {
            btn.setEmoji(EMOJI_X);
          } else if (board[index] === 'O') {
            btn.setEmoji(EMOJI_O);
          } else {
            btn.setLabel('\u200b');
          }

          row.addComponents(btn);
        }
        rows.push(row);
      }
      return rows;
    };

    const getEmbed = () => embeds.security(
      `${interaction.guild.name} — Tic-Tac-Toe`,
      `**Player 1 (${EMOJI_X}):** ${interaction.user}\n` +
      `**Player 2 (${EMOJI_O}):** ${opponent}\n\n` +
      `**Current Turn:** <@${turn}>`
    );

    const response = await interaction.editReply({ embeds: [getEmbed()], components: renderRows() });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    const checkWin = (symbol) => {
      const wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
      ];
      return wins.some(combo => combo.every(idx => board[idx] === symbol));
    };

    collector.on('collect', async btn => {
      if (btn.user.id !== turn) {
        return btn.reply({ content: "It's not your turn!", ephemeral: true });
      }

      const index = parseInt(btn.customId.split('_')[1]);
      const symbol = turn === interaction.user.id ? 'X' : 'O';
      board[index] = symbol;

      if (checkWin(symbol)) {
        collector.stop('win');
        const winnerEmoji = symbol === 'X' ? EMOJI_X : EMOJI_O;
        const winEmbed = embeds.security(
          `${interaction.guild.name} — Match Ended`,
          `${embeds.emojis.CHECK} **Winner:** <@${turn}> ${winnerEmoji}!`
        );
        return btn.update({ embeds: [winEmbed], components: renderRows(true) });
      }

      if (!board.includes(null)) {
        collector.stop('draw');
        const drawEmbed = embeds.warning('Match Ended', "It's a draw!");
        return btn.update({ embeds: [drawEmbed], components: renderRows(true) });
      }

      turn = turn === interaction.user.id ? opponent.id : interaction.user.id;
      await btn.update({ embeds: [getEmbed()], components: renderRows() });
    });

    collector.on('end', (_, reason) => {
      if (reason !== 'win' && reason !== 'draw') {
        interaction.editReply({ components: renderRows(true) }).catch(() => {});
      }
    });
  }
};
