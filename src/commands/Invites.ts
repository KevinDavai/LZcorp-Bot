import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";

import { sendErrorEmbedWithCountdown } from "utils/MessageUtils";
import { getAllInviteByUser } from "database/utils/InviteUtils";

export class Invites extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("invites")
        .setDescription(
          "Afficher les info sur les invitations d'un utilisateur.",
        )
        .addUserOption((option) =>
          option.setName("pseudo").setDescription("Nom de l'utilisateur."),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const user = interaction.options.getUser("pseudo") || interaction.user;

    if (!user) {
      await sendErrorEmbedWithCountdown(interaction, [
        "L'utilisateur n'existe pas ou est introuvable.",
      ]);
      return;
    }

    const userInvites = await getAllInviteByUser(user.id);

    console.log(userInvites);

    // Calcul du total des utilisateurs invités
    const totalInvitedUser = userInvites.reduce(
      (total, invite) => total + invite.uses,
      0,
    );

    // Calcul du total des utilisateurs invités (unique)
    const totalUsersInvited = userInvites.reduce(
      (total, invite) => total + invite.invitedUsers.length,
      0,
    );

    // Calcul du total des invitations échouées
    const totalFailedInvites = totalInvitedUser - totalUsersInvited;

    const inviteEmbed = new EmbedBuilder()
      .setTitle(`Invitations de ${user.username}`)
      .setDescription(
        `Voici tes statistiques d'invitations :\n\n●  **Invitations totales** : \`\`${totalInvitedUser}\`\`\n●  **Invitations réussies** : \`\`${totalUsersInvited}\`\`\n● **Invitations échouées** : \`\`${totalFailedInvites}\`\`\n\nAméliore tes stats en invitant plus de personnes sur le serveur !`,
      )
      .setColor("#87CEFA")
      .setFooter({
        text: "© Copyright LZCorp",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [inviteEmbed], ephemeral: true });
  }
}
