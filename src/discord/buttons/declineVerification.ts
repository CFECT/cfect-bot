import { ActionRowBuilder, ButtonInteraction, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { Button } from "../registry/Button";
import Database from "../../Database";

export default class DeclineVerification extends Button {
    constructor() {
        super("declineVerification-", true);
    }

    public async execute(interaction: ButtonInteraction): Promise<void> {
        const modal = new ModalBuilder()
            .setTitle("Rejeitar Verificação")
            .setCustomId("declineVerificationModal-" + interaction.customId.split("-")[1]);

        await Database.run("UPDATE Verifications SET InteractionMessageID = ? WHERE ID = ?", [interaction.message.id, interaction.customId.split("-")[1]]);
        const user = await Database.get("SELECT * FROM Verifications WHERE ID = ?", [interaction.customId.split("-")[1]]);
        if (!user) {
            await interaction.reply({ content: "Não foi possível encontrar o utilizador.", flags: MessageFlags.Ephemeral });
            return;
        }

        const inputReason = new TextInputBuilder()
            .setLabel("Motivo")
            .setCustomId("reason")
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph)
        const actionRowNome = new ActionRowBuilder<TextInputBuilder>().addComponents(inputReason);

        modal.addComponents(actionRowNome);
        await interaction.showModal(modal);
    }
}
