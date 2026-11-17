import { ChannelType, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { baseEmbed } from '../../ui/theme.js';
import type { SlashCommand } from '../types.js';

/** /serverinfo command. */
export const serverinfo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show information about this server')
    .setContexts(InteractionContextType.Guild),
  async execute(interaction, _ctx) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: 'This command only works in a server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const guild = interaction.guild;
    const channels = [...guild.channels.cache.values()];
    const text = channels.filter((c) => c.type === ChannelType.GuildText).length;
    const voice = channels.filter((c) => c.type === ChannelType.GuildVoice).length;

    const embed = baseEmbed()
      .addFields(
        { name: 'Member Count', value: String(guild.memberCount) },
        { name: 'Channels', value: `${text} : text | ${voice} : voice` },
      )
      .setTimestamp(new Date());
    const icon = guild.iconURL();
    if (icon) embed.setThumbnail(icon);
    const banner = guild.bannerURL();
    if (banner) embed.setImage(banner);
    await interaction.reply({ embeds: [embed] });
  },
};
