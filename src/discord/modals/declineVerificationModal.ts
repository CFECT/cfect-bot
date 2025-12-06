import { EmbedBuilder, MessageFlags, ModalSubmitInteraction } from "discord.js";
import { Modal } from "../registry/Modal";
import Constants from "../../Constants";
import Database from "../../Database";

export default class AcceptVerificationModal extends Modal {
    constructor() {
        super("declineVerificationModal-", true);
    }

    public async execute(interaction: ModalSubmitInteraction): Promise<void> {
        const values = interaction.fields.fields.map((field) => {
            return {
                name: field.customId,
                value: interaction.fields.getTextInputValue(field.customId),
            }
        });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const verification = await Database.get("SELECT * FROM Verifications WHERE ID = ?", [interaction.customId.split("-")[1]]);
        if (!verification) {
            await interaction.editReply({ content: "Não foi possível encontrar o pedido de verificação." });
            return;
        }
        const discordId = verification.DiscordID;
        if (!discordId) {
            await interaction.editReply({ content: `Não foi possível encontrar o utilizador.` });
            return;
        }

        const reason = values.find((value) => value.name === "reason");
        const interactionMessageId = verification.InteractionMessageID;
        const message = await interaction.channel?.messages.fetch(interactionMessageId as string);

        if (!reason) {
            await interaction.editReply({ content: `Por favor, preencha todos os campos.` });
            return;
        }

        await Database.run("DELETE FROM Verifications WHERE ID = ?", [interaction.customId.split("-")[1]]);

        const originalEmbed = message?.embeds[0].toJSON();
        const newEmbed = new EmbedBuilder(originalEmbed)
            .setColor(Constants.EMBED_COLORS.DENIED)
            .addFields({
                name: "Motivo",
                value: reason.value
            })
            .setFooter({
                text: `Verificação rejeitada por ${interaction.user.tag} (${interaction.user.id})`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp(Date.now());

        await message?.edit({ embeds: [newEmbed], components: [] });

        const user = interaction.client.users.cache.get(discordId);
        if (user) {
            const dmEmbed = new EmbedBuilder()
                .setTitle("Verificação Rejeitada")
                .setColor(Constants.EMBED_COLORS.DENIED)
                .setDescription(`O teu pedido de verificação foi rejeitado!\nPor favor tenta novamente com os dados corretos.`)
                .addFields({
                    name: "Motivo",
                    value: reason.value
                });
            await user.send({ embeds: [dmEmbed] }).catch(() => {});
        }

        await interaction.editReply({ content: `Verificação rejeitada!` });
    }
}
