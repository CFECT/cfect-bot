import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { Modal } from "../registry/Modal";
import Database from "../../Database";
import Utils from "../../Utils";

export default class NumeroAluviaoModal extends Modal {
    constructor() {
        super("numeroAluviao-", true);
    }

    public async execute(interaction: ModalSubmitInteraction): Promise<void> {
        const values = interaction.fields.fields.map((field) => {
            return {
                name: field.customId,
                value: interaction.fields.getTextInputValue(field.customId),
            }
        });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const discordId = interaction.customId.split("-")[1];
        if (!discordId) {
            await interaction.editReply({ content: "Não foi possível encontrar o utilizador." });
            return;
        }

        const number = values.find((value) => value.name === "number")?.value;

        if (!number) {
            await interaction.editReply({ content: "Por favor, preencha todos os campos." });
            return;
        }

        await Database.run("UPDATE Users SET NumeroAluviao = ? WHERE DiscordID = ?", [number, discordId]);

        const user = await interaction.guild?.members.fetch(discordId);
        if (!user) {
            await interaction.editReply({ content: "Não foi possível encontrar o utilizador." });
            return;
        }
        await Utils.updateNickname(user);

        await interaction.editReply({ content: `Número de faina de ${user} alterado para \`${number}\`!` });
    }
}

