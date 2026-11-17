import { Events, MessageFlags } from 'discord.js';
import type { ChatInputCommandInteraction, Client } from 'discord.js';
import { log } from '../log.js';
import { malErrorMessage } from '../commands/mal/errors.js';
import type { BotContext } from './context.js';
import { getCommand } from './registry.js';

async function replyEphemeral(
  interaction: ChatInputCommandInteraction,
  content: string,
): Promise<void> {
  const payload = { content, flags: MessageFlags.Ephemeral } as const;
  if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
  else await interaction.reply(payload);
}

async function dispatch(interaction: ChatInputCommandInteraction, ctx: BotContext): Promise<void> {
  const cmd = getCommand(interaction.commandName);
  if (!cmd) {
    log.warn(`Unknown command: ${interaction.commandName}`);
    await interaction.reply({ content: 'Unknown command.', flags: MessageFlags.Ephemeral });
    return;
  }
  try {
    await cmd.execute(interaction, ctx);
  } catch (err) {
    log.error(`Command /${interaction.commandName} failed`, err);
    try {
      await replyEphemeral(interaction, malErrorMessage(err) ?? 'Something went wrong.');
    } catch (replyErr) {
      log.error('Failed to send error reply', replyErr);
    }
  }
}

/** Attach the interactionCreate handler: dispatch chat-input commands with uniform error replies. */
export function registerRouter(client: Client, ctx: BotContext): void {
  client.on(Events.InteractionCreate, (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    void dispatch(interaction, ctx).catch((err: unknown) => {
      log.error('Router failure', err);
    });
  });
}
