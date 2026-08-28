const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

const GEM_EMOJI = '<a:HD_lgem4:1457002969345294554>';
const ITEMS = [GEM_EMOJI, '🍒', '🍋', '🔔', '⭐️', '7️⃣'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Spin the casino slot machine'),

  async execute(interaction) {
    await interaction.deferReply();

    const slot1 = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    const slot2 = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    const slot3 = ITEMS[Math.floor(Math.random() * ITEMS.length)];

    let isWin = false;
    let isJackpot = false;

    if (slot1 === slot2 && slot2 === slot3) {
      isWin = true;
      if (slot1 === GEM_EMOJI) isJackpot = true;
    } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
      isWin = true;
    }

    let statusText = `${embeds.emojis.CROSS} No match! Better luck next time.`;
    if (isJackpot) {
      statusText = `${embeds.emojis.CROWN} **ULTIMATE GEM JACKPOT!** You matched 3 Animated Gems!`;
    } else if (isWin) {
      statusText = `${embeds.emojis.CHECK} **WINNER!** You matched slot symbols!`;
    }

    const slotEmbed = embeds.security(
      `${interaction.guild.name} — Gem Slots`,
      `**Player:** ${interaction.user}\n\n` +
      `[ ${slot1} | ${slot2} | ${slot3} ]\n\n` +
      `${statusText}`
    );

    return interaction.editReply({ embeds: [slotEmbed] });
  }
};
