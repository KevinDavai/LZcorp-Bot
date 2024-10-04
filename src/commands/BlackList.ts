import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  PermissionFlagsBits,
  User,
} from "discord.js";
import { CustomClient } from "structures/CustomClient";
import { BaseCommand } from "structures/BaseCommand";
import { SlashCommandBuilder } from "@discordjs/builders";

import {
  getOrFetchChannelById,
  getOrFetchMemberById,
  getOrFetchMessageById,
  getOrFetchRoleById,
  sendErrorEmbedWithCountdown,
  sendValidEmbedWithCountdown,
} from "utils/MessageUtils";
import { getGuildSettings } from "database/utils/GuildsUtils";
import { getUserById, setBlackListedStatus } from "database/utils/UserUtils";

export class BlackList extends BaseCommand {
  public constructor(client: CustomClient) {
    super(client, {
      data: new SlashCommandBuilder()
        .setName("blacklist")
        .setDescription("Ajouter / Supprimer un utilisateur blacklist")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("Ajouter un utilisateur à la blacklist.")
            .addUserOption((option) =>
              option
                .setName("pseudo")
                .setDescription("Nom de l'utilisateur à blacklist.")
                .setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName("raison")
                .setDescription("Raison de la blacklist.")
                .setMaxLength(1024)
                .setRequired(false),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setDescription("Supprimer un utilisateur de la blacklist.")
            .addUserOption((option) =>
              option
                .setName("pseudo")
                .setDescription(
                  "Nom de l'utilisateur à retirer de la blacklist.",
                )
                .setRequired(true),
            ),
        ),
    });
  }

  public async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const subcommands: Record<string, () => Promise<void>> = {
      add: async () => {
        const user = interaction.options.getUser("pseudo");
        const raison =
          interaction.options.getString("raison") || "Aucune raison";
        if (!user) {
          await sendErrorEmbedWithCountdown(interaction, [
            "Utilisateur invalide.",
          ]);
          return;
        }

        await this.addBlackListUser(interaction, user, raison);
      },
      remove: async () => {
        const user = interaction.options.getUser("pseudo");
        if (!user) {
          await sendErrorEmbedWithCountdown(interaction, [
            "Utilisateur invalide.",
          ]);
          return;
        }

        await this.removeBlackListUser(interaction, user);
      },
    };

    const guildSettings = await getGuildSettings(interaction.guild!.id);

    if (
      !guildSettings.blacklist_role_id ||
      !guildSettings.blacklist_channel_id
    ) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le role ou le channel de blacklist n'est pas configuré.",
        "La commande blacklist est donc désactivée.",
      ]);
      return;
    }

    const channel = getOrFetchChannelById(
      interaction.client as CustomClient,
      interaction.channelId,
    );
    const role = getOrFetchRoleById(
      interaction.guild!,
      guildSettings.blacklist_role_id,
    );

    if (!channel || !role) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le role ou le channel de blacklist est introuvable.",
      ]);
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    if (subcommands[subcommand]) {
      await subcommands[subcommand]();
    } else {
      await sendErrorEmbedWithCountdown(interaction, [
        "Sous commande inconnue.",
      ]);
    }
  }

  private async addBlackListUser(
    interaction: ChatInputCommandInteraction,
    user: User,
    raison: string,
  ): Promise<void> {
    const userDetail = await getUserById(user.id, interaction.guild!.id);

    if (userDetail.isBlackListed) {
      await sendErrorEmbedWithCountdown(interaction, [
        `L'utilisateur ${user.displayName} est déjà blacklisté.`,
      ]);
      return;
    }

    const guildSettings = await getGuildSettings(interaction.guild!.id);

    const blacklistChannel = await getOrFetchChannelById(
      interaction.client as CustomClient,
      guildSettings.blacklist_channel_id!,
    );
    const blacklistRole = await getOrFetchRoleById(
      interaction.guild!,
      guildSettings.blacklist_role_id!,
    );
    const member = await getOrFetchMemberById(interaction.guild!, user.id);

    if (!blacklistChannel || !blacklistChannel.isTextBased()) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le channel de blacklist est introuvable ou n'est pas un channel text.",
      ]);
      return;
    }

    if (!blacklistRole) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le role de blacklist est introuvable.",
      ]);
      return;
    }

    const blacklistEmbed = new EmbedBuilder()
      .setTitle(`🔒 | Blacklist de ${user.displayName}`)
      .addFields([
        {
          name: "Utilisateur",
          value: `<@${user.id}> \`\`${user.id}\`\``,
          inline: false,
        },
        {
          name: "Raison",
          value: raison,
          inline: false,
        },
      ])
      .setTimestamp()
      .setColor(Colors.Red)
      .setThumbnail(user.displayAvatarURL());

    let msgId = "";
    await blacklistChannel.send({ embeds: [blacklistEmbed] }).then((msg) => {
      msg.startThread({ name: `🔒 | Blacklist de ${user.displayName}` });
      msgId = msg.id;
    });

    if (member) {
      member.roles.add(blacklistRole);
      await setBlackListedStatus(
        user.id,
        interaction.guild!.id,
        true,
        raison,
        msgId,
      );
    }

    await sendValidEmbedWithCountdown(interaction, [
      `L'utilisateur ${user.displayName} a été ajouté à la blacklist.`,
    ]);
  }

  private async removeBlackListUser(
    interaction: ChatInputCommandInteraction,
    user: User,
  ): Promise<void> {
    const userDetail = await getUserById(user.id, interaction.guild!.id);

    if (!userDetail.isBlackListed) {
      await sendErrorEmbedWithCountdown(interaction, [
        `L'utilisateur ${user.displayName} n'est pas blacklisté.`,
      ]);
      return;
    }

    const guildSettings = await getGuildSettings(interaction.guild!.id);
    const blacklistRole = await getOrFetchRoleById(
      interaction.guild!,
      guildSettings.blacklist_role_id!,
    );
    const member = await getOrFetchMemberById(interaction.guild!, user.id);
    const blacklistChannel = await getOrFetchChannelById(
      interaction.client as CustomClient,
      guildSettings.blacklist_channel_id!,
    );

    if (!blacklistRole) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le role de blacklist est introuvable.",
      ]);
      return;
    }

    if (!member) {
      await sendErrorEmbedWithCountdown(interaction, [
        "L'utilisateur n'est pas membre du serveur.",
      ]);
      return;
    }

    if (!blacklistChannel) {
      await sendErrorEmbedWithCountdown(interaction, [
        "Le channel de blacklist est introuvable.",
      ]);
      return;
    }

    const blackListedMessage = await getOrFetchMessageById(
      blacklistChannel,
      userDetail.blackListedMessageId!,
    );

    if (blackListedMessage) {
      await blackListedMessage.delete();
    }

    member.roles.remove(blacklistRole);

    await setBlackListedStatus(user.id, interaction.guild!.id, false);

    await sendValidEmbedWithCountdown(interaction, [
      `L'utilisateur ${user.displayName} a été retiré de la blacklist.`,
    ]);
  }
}
