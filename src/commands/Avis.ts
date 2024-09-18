import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import {
  getOrFetchChannelById,
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import { getGuildSettings } from "database/utils/GuildsUtils";

export class Avis extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("avis")
        .setDescription("Donner un avis sur un service.")
        .addStringOption((option) =>
          option
            .setName("service")
            .setDescription("Le service utilisé")
            .setRequired(true)
            .addChoices(
              { name: "Communication", value: "communication" },
              { name: "Audiovisuel", value: "audiovisuel" },
              { name: "Artistique", value: "artistique" },
              { name: "Développement", value: "developpement" },
            ),
        )
        .addStringOption((option) =>
          option.setName("avis").setDescription("Ton avis").setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("note")
            .setDescription("Ta note (de 1 à 5)")
            .setMinValue(1)
            .setMaxValue(5)
            .setRequired(true),
        ),
    });
  }

  private getStarRating(note: number, maxNote: number = 5): string {
    const fullStar = "⭐";

    // Crée une chaîne avec les étoiles pleines
    const filledStars = fullStar.repeat(note);

    // Crée une chaîne avec les étoiles vides pour le reste

    return filledStars;
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const guildSettings = await getGuildSettings(interaction.guildId!);
    const channelAvis = guildSettings.avis_channel_id;

    if (!channelAvis || guildSettings.isPrestataireOn === true) {
      await sendErrorEmbedWithCountdown(interaction, [
        "La fonctionnalité avis est désactivée sur ce serveur.",
      ]);
      return;
    }

    const channel = await getOrFetchChannelById(
      interaction.guild!,
      channelAvis,
    );

    if (!channel || !channel.isTextBased()) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le channel d'avis est introuvable.",
      ]);
      return;
    }

    const service = interaction.options.getString("service", true);
    const avis = interaction.options.getString("avis", true);
    const note = interaction.options.getNumber("note", true);

    const avisEmbed = new EmbedBuilder()
      .setTitle(`📝 | Avis de ${interaction.user.username}`)
      .setDescription(
        `➜ **Services** : ${service}\n➜ **Avis** : ${avis}\n➜ **Notation** : ${this.getStarRating(note)}`,
      )
      .setColor("#87CEFA")
      .setFooter({
        text: "© Copyright LZCorp | NewsMC",
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    await channel.send({ embeds: [avisEmbed] });

    await sendValidEmbedWithCountdown(interaction, [
      "Votre avis a bien été envoyé.",
    ]);
  }
}
