import { getGuildSettings } from "database/utils/GuildsUtils";
import { getProfilEmbeds } from "database/utils/ProfilModel";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { BaseCommand } from "structures/BaseCommand";
import { CustomClient } from "structures/CustomClient";
import {
  getOrFetchChannelById,
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";

export class AvisNewsMc extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("avis")
        .setDescription("Donner un avis sur un prestataire.")
        .addUserOption((option) =>
          option
            .setName("prestataire")
            .setDescription("Le prestataire à noter")
            .setRequired(true),
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
    this.guildIdOnly = "916487743004114974";
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

    if (!channelAvis) {
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

    const prestataire = interaction.options.getUser("prestataire", true);
    const avis = interaction.options.getString("avis", true);
    const note = interaction.options.getNumber("note", true);

    const prestataireDb = await getProfilEmbeds(
      prestataire.id,
      interaction.guildId!,
    );

    if (!prestataireDb) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le prestataire n'existe pas.",
      ]);
      return;
    }

    const avisEmbed = new EmbedBuilder()
      .setTitle(`📝 | Avis de ${interaction.user.username}`)
      .setDescription(
        `➜ **Prestataire** : <@${prestataire.id}>\n➜ **Avis** : ${avis}\n➜ **Notation** : ${this.getStarRating(note)}`,
      )
      .setColor("#87CEFA") // Couleur verte
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
