import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../types.js';

/** /ping command. */
export const ping: SlashCommand = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot latency'),
  async execute(interaction, _ctx) {
    await interaction.reply(`Pong! ${Math.round(interaction.client.ws.ping)} ms`);
  },
};
