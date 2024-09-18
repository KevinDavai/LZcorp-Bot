import { EmbedBuilder, GuildMember } from "discord.js";
import { Logger } from "services/Logger";
import { getOrFetchChannelById } from "utils/MessageUtils";
import { CustomClient } from "structures/CustomClient";
import Logs from "../lang/logs.json";

export async function sendWelcomeEmbed(
  member: GuildMember,
  welcomeChannelId: string,
): Promise<void> {
  try {
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`» Bienvenue __${member.displayName}__ sur LZCorp !`)
      .setDescription(
        `➜ Commence dès maintenant et rend toi sur <#760745745195728946>
          ➜ Pour avoir accès au support <#929743910027272322>
          ➜ Pour pouvoir passer commande <#929752200085930064>
          ➜ Pour avoir nos prix <#1192845767539441825>`,
      )
      .setFooter({
        text: "© Copyright LZCorp | NewsMC",
        iconURL: member.client.user.displayAvatarURL(),
      })
      .setColor("#87CEFA");

    // Essaye de récupérer le canal de bienvenue
    const welcomeChannel = await getOrFetchChannelById(
      member.client as CustomClient,
      welcomeChannelId,
    );

    // Si le canal n'est pas trouvé, on lève une erreur
    if (!welcomeChannel || !welcomeChannel.isTextBased()) {
      throw new Error(
        `Channel with ID ${welcomeChannelId} not found not found or channel is not a text channel`,
      );
    }

    // Si tout est bon, envoie l'embed
    await welcomeChannel.send({ embeds: [welcomeEmbed] });
  } catch (error) {
    Logger.error(Logs.error.welcomeEmbedSend, member.displayName, error);
    throw error;
  }
}
