import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";

import { sendErrorEmbedWithCountdown } from "utils/MessageUtils";
import {
  getAllInviteByUser,
  getTop10Invites,
} from "database/utils/InviteUtils";
import { sub } from "date-fns";

export class Classement extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("classement")
        .setDescription("Afficher les classements des utilisateurs.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("invites")
            .setDescription("Afficher le classement des invitations."),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const topInvites = await getTop10Invites(interaction.guild!);

    if (!topInvites) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Aucune invitation trouvée.",
      ]);
      return;
    }

    const inviteEmbed = new EmbedBuilder()
      .setTitle(`Classement global des invitations`)
      .setColor("#87CEFA")
      .setFooter({
        text: "© Copyright LZCorp",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    let description = "";
    topInvites.forEach((invite, index) => {
      description += `\`\`${index + 1}\`\` <@${invite.inviterId}>\n> Invitations réussies : \`\`${invite.totalInvitedUsers}\`\`\n> Invitations échouées : \`\`${invite.totalFailedInvites}\`\`\n> Invivations totales : \`\`${invite.totalInvitations}\`\`\n`;
    });

    inviteEmbed.setDescription(description);

    await interaction.reply({ embeds: [inviteEmbed], ephemeral: true });
  }
}
