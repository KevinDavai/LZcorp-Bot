import {
  Channel,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildChannel,
  PermissionFlagsBits,
  PermissionsBitField,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import {
  ActionRowBuilder,
  SelectMenuBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "@discordjs/builders";
import {
  getOrFetchChannelById,
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";

export class AutoRoleSetup extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("autorole-setup")
        .setDescription("Configurer un autorole.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) =>
          option
            .setName("autorole")
            .setDescription("l'autorole à configurer")
            .setRequired(true)
            .addChoices(
              { name: "Secteur d'activité (LZCorp)", value: "secteur" },
              {
                name: "Disponibilité prestataire (NewsMC)",
                value: "prestataire_dispo",
              },
              { name: "Global (NewsMC)", value: "global" },
              { name: "Booster (NewsMC)", value: "booster" },
            ),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const channelId = interaction.channel?.id;

    if (!channelId) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Impossible de récupérer l'ID du salon.",
      ]);
      return;
    }

    if (!interaction.guild) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Impossible de récupérer le serveur.",
      ]);
      return;
    }

    const channel = await getOrFetchChannelById(interaction.guild, channelId);

    if (!channel) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Impossible de récupérer le salon.",
      ]);
      return;
    }

    if (channel.type !== ChannelType.GuildText) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le salon n'est pas un salon de serveur.",
      ]);
      return;
    }

    const choice = interaction.options.getString("autorole", true);

    switch (choice) {
      case "secteur":
        await this.setupServerType(interaction, channel);
        break;
      case "prestataire_dispo":
        await this.setupPrestataireDispo(interaction, channel);
        break;
      case "global":
        await this.setupGlobal(interaction, channel);
        break;
      case "booster":
        await this.setupBooster(interaction, channel);
        break;
      default:
        await sendErrorEmbedWithCountdown(interaction, ["Choix invalide."]);
    }
  }

  private async setupServerType(
    interaction: ChatInputCommandInteraction,
    channel: TextChannel,
  ) {
    const embed = new EmbedBuilder()
      .setTitle("🔎 | Secteur d'activité")
      .setDescription("> Veuillez choisir votre secteur d'activité")
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/772050282057957376/1286355490506412146/lzcorp-icon.jpg?ex=66ed9b68&is=66ec49e8&hm=efdd046218743a99e208e096195cc2b1e227b87f39bb477a9ab5728e77f9c8fd&",
      )
      .setFooter({
        text: "© Copyright LZCorp | NewsMC",
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setColor("#87CEFA");

    const select = new StringSelectMenuBuilder()
      .setCustomId("secteur_activite")
      .setPlaceholder("Sélectionnez votre secteur d'activité")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Faction")
          .setValue("faction")
          .setEmoji("⚔️"),
        new StringSelectMenuOptionBuilder()
          .setLabel("SkyBlock")
          .setValue("skyblock")
          .setEmoji("🌍"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Survie")
          .setValue("survie")
          .setEmoji("🌳"),
        new StringSelectMenuOptionBuilder()
          .setLabel("UHC / Autres")
          .setValue("uhc")
          .setEmoji("🎮"),
      );

    const row = new ActionRowBuilder<SelectMenuBuilder>().addComponents(select);

    await channel.send({ embeds: [embed], components: [row] });
    await sendValidEmbedWithCountdown(interaction, [
      "L'autorole a été configuré.",
    ]);
  }

  private async setupPrestataireDispo(
    interaction: ChatInputCommandInteraction,
    channel: TextChannel,
  ) {
    const embed = new EmbedBuilder()
      .setTitle("🔎 | Statut des prestataires")
      .setDescription(
        "> Sélectionnez votre disponibilité à l'aide du menu déroulant ci-dessous.",
      )
      .setColor("#87CEFA")
      .setFooter({
        text: "© Copyright LZCorp | NewsMC",
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    const select = new StringSelectMenuBuilder()
      .setCustomId("prestataire_dispo")
      .setPlaceholder("Sélectionnez votre disponibilité")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Disponible")
          .setValue("prestataire_disponible")
          .setEmoji("✅"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Indisponible")
          .setValue("prestataire_indisponible")
          .setEmoji("❌"),
      );

    const row = new ActionRowBuilder<SelectMenuBuilder>().addComponents(select);

    await channel.send({ embeds: [embed], components: [row] });
    await sendValidEmbedWithCountdown(interaction, [
      "L'autorole a été configuré.",
    ]);
  }

  private async setupGlobal(
    interaction: ChatInputCommandInteraction,
    channel: TextChannel,
  ) {
    const embed = new EmbedBuilder()
      .setTitle("🔎 | Choisissez les rôles que vous désirez")
      .setColor("#87CEFA")
      .setFooter({
        text: "© Copyright LZCorp | NewsMC",
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    const select = new StringSelectMenuBuilder()
      .setCustomId("global")
      .setPlaceholder("Sélectionnez vos rôles")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Homme")
          .setValue("homme")
          .setEmoji("🚹"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Femme")
          .setValue("femme")
          .setEmoji("🚺"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Majeur")
          .setValue("majeur")
          .setEmoji("🧑"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Mineur")
          .setValue("mineur")
          .setEmoji("🧒"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Notifications Annonces")
          .setValue("notif_annonce")
          .setEmoji("🔔"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Notifications Giveaways")
          .setValue("notif_giveaway")
          .setEmoji("🎉"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Notifications Events")
          .setValue("notif_event")
          .setEmoji("🎈"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Joueur minecraft java")
          .setValue("java")
          .setEmoji("☕"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Joueur minecraft bedrock")
          .setValue("bedrock")
          .setEmoji("🪨"),
      );

    const row = new ActionRowBuilder<SelectMenuBuilder>().addComponents(select);

    await channel.send({ embeds: [embed], components: [row] });
    await sendValidEmbedWithCountdown(interaction, [
      "L'autorole a été configuré.",
    ]);
  }

  private async setupBooster(
    interaction: ChatInputCommandInteraction,
    channel: TextChannel,
  ) {
    const embed = new EmbedBuilder()
      .setTitle("🔎 | Rôle Boosters")
      .setDescription(
        "> Sélectionnez votre rôle customisé obtenu grâce à votre boost.",
      )
      .setColor("#87CEFA")
      .setFooter({
        text: "© Copyright LZCorp | NewsMC",
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    const select = new StringSelectMenuBuilder()
      .setCustomId("booster")
      .setPlaceholder("Sélectionnez vos rôles")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Baron du Dév")
          .setValue("baron_dev")
          .setEmoji("👑"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Créateur de Rêves")
          .setValue("createur_reve")
          .setEmoji("🌟"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Maître Batisseur")
          .setValue("maitre_batisseur")
          .setEmoji("🏗️"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Rêveur Romantique")
          .setValue("reveur_romantique")
          .setEmoji("💖"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Daron des canapés")
          .setValue("daron_canape")
          .setEmoji("🛋️"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Amateurde Cocktails")
          .setValue("amateur_cocktails")
          .setEmoji("🍹"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Sensei")
          .setValue("sensei")
          .setEmoji("🥋"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Modo Discord")
          .setValue("modo_discord")
          .setEmoji("🛡️"),
      );

    const row = new ActionRowBuilder<SelectMenuBuilder>().addComponents(select);

    await channel.send({ embeds: [embed], components: [row] });
    await sendValidEmbedWithCountdown(interaction, [
      "L'autorole a été configuré.",
    ]);
  }
}
