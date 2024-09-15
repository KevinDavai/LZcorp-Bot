import { Message, EmbedBuilder } from "discord.js";
import { Logger } from "services/Logger";
import { CustomClient } from "structures/CustomClient";
import { getOrFetchChannelById } from "utils/MessageUtils";
import Logs from "../lang/logs.json";

export async function createNewSuggestion(
  message: Message,
  suggestionChannelId: string,
) {
  try {
    // Essaye de récupérer le canal de suggestion
    const suggestionChannel = await getOrFetchChannelById(
      message.client as CustomClient,
      suggestionChannelId,
    );

    // Si le canal n'est pas trouvé, on lève une erreur
    if (!suggestionChannel || !suggestionChannel.isTextBased()) {
      throw new Error(
        `Channel with ID ${suggestionChannel} not found or channel is not a text channel`,
      );
    }

    const threadAuthor = message.author.displayName;
    const suggestEmbed = new EmbedBuilder()
      .setColor("Green")
      .setTitle(`📫 Suggestion de ${threadAuthor}`)
      .setDescription(message.content)
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({
        text: "📝 Ecris ta suggestion directement dans ce salon et discute-en dans le fil ci-dessous.",
        iconURL: message.client.user.displayAvatarURL(),
      });

    message.delete();

    await suggestionChannel.send({ embeds: [suggestEmbed] }).then((msg) => {
      msg.react("✅");
      msg.react("❌");
      msg.startThread({ name: `📢 Débat | Suggestion de ${threadAuthor}` });
    });
  } catch (error) {
    Logger.error(Logs.error.suggestionCreate, error);
    throw error;
  }
}
