import {
  GuildMember,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  TimestampStyles,
  time,
} from 'discord.js';
import { baseEmbed } from '../../ui/theme.js';
import type { SlashCommand } from '../types.js';

/** /userinfo command. */
export const userinfo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show information about a member')
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('Member to look up (default: you)')),
  async execute(interaction, _ctx) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: 'This command only works in a server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const picked = interaction.options.getUser('user');
    const user = picked ?? interaction.user;
    const resolved = picked ? interaction.options.getMember('user') : interaction.member;
    const member = resolved instanceof GuildMember ? resolved : null;
    const displayName = member?.displayName ?? user.displayName;
    const joined = member?.joinedAt
      ? time(member.joinedAt, TimestampStyles.LongDateTime)
      : 'Unknown';

    const embed = baseEmbed()
      .setTitle('User Info:')
      .setDescription(`Here is user ${displayName}'s info:`)
      .setThumbnail(member?.displayAvatarURL() ?? user.displayAvatarURL())
      .addFields(
        { name: 'ID', value: user.id },
        { name: 'Username', value: user.username },
        { name: 'Nickname', value: displayName },
        { name: 'Joined at', value: joined },
        { name: 'Bot?', value: user.bot ? 'Yes' : 'No' },
      );
    await interaction.reply({ embeds: [embed] });
  },
};
