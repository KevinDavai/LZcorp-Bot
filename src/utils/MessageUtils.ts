// utils/MessageUtils.ts
import {
  EmbedBuilder,
  TextChannel,
  Message,
  Interaction,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
} from "discord.js";

export async function sendErrorEmbedWithCountdown(
  interaction: ModalSubmitInteraction | ChatInputCommandInteraction,

  errors: string[],
): Promise<void> {
  const countdownDuration = 10000;
  let countdown = countdownDuration / 1000;

  const errorEmbed = new EmbedBuilder()
    .setDescription(
      "**Ce message sera supprimé dans** ``" + countdown + "`` **secondes**\n",
    )
    .setColor(0xff0000)
    .addFields({ name: "❌ **Erreurs**", value: `\n ${errors.join("\n")}` });

  await interaction.reply({ embeds: [errorEmbed], ephemeral: true });

  const interval = setInterval(async () => {
    countdown -= 1;
    if (countdown <= 0) {
      clearInterval(interval);
      await interaction.deleteReply();
    } else {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              "**Ce message sera supprimé dans** ``" +
                countdown +
                "`` **secondes**\n",
            )
            .setColor(0xff0000)
            .setFields(errorEmbed.data.fields ?? []),
        ],
      });
    }
  }, 1000);
}
