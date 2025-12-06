import { ActionRowBuilder, ButtonInteraction, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { Button } from "../registry/Button";
import Database from "../../Database";

export default class ShowVerificationModalButton extends Button {
    constructor() {
        super("showVerificationModal");
    }

    public async execute(interaction: ButtonInteraction): Promise<void> {
        const verification = await Database.get("SELECT * FROM Verifications WHERE DiscordID = ?", [interaction.user.id]);
        if (verification) {
            await interaction.reply({ content: "Já tens um pedido de verificação pendente.", flags: MessageFlags.Ephemeral });
            return;
        }

        const user = await Database.get("SELECT * FROM Users WHERE DiscordID = ?", [interaction.user.id]);
        if (user) {
            await interaction.reply({ content: "Já tens uma conta associada.", flags: MessageFlags.Ephemeral });
            return;
        }

        const modal = new ModalBuilder()
            .setTitle("Verificação")
            .setCustomId("verificationModal");

        const inputNome = new TextInputBuilder()
            .setLabel("Nome")
            .setCustomId("nome")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Introduz o teu nome (primeiro e último)")
            .setMaxLength(50);
        const actionRowNome = new ActionRowBuilder<TextInputBuilder>().addComponents(inputNome);

        const inputNomeFaina = new TextInputBuilder()
            .setLabel("Nome de Faina")
            .setCustomId("nome-faina")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Exemplo: apenas 'Monteiro' para ficar 'Mestre Monteiro'")
            .setMaxLength(50)
        const actionRowNomeFaina = new ActionRowBuilder<TextInputBuilder>().addComponents(inputNomeFaina);

        const inputNumero = new TextInputBuilder()
            .setLabel("Número Mecanográfico")
            .setCustomId("numero")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Introduz o teu número mecanográfico")
            .setMinLength(5)
            .setMaxLength(6)
        const actionRowNumero = new ActionRowBuilder<TextInputBuilder>().addComponents(inputNumero);

        const inputMatricula = new TextInputBuilder()
            .setLabel("Matrícula")
            .setCustomId("matricula")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Introduz a tua matrícula (1-9, para 10 ou mais, introduz 0)")
            .setMinLength(1)
            .setMaxLength(1)
        const actionRowMatricula = new ActionRowBuilder<TextInputBuilder>().addComponents(inputMatricula);

        const inputSexo = new TextInputBuilder()
            .setLabel("Sexo")
            .setCustomId("sexo")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Introduz o teu sexo (M/F)")
            .setMinLength(1)
            .setMaxLength(1)
        const actionRowSexo = new ActionRowBuilder<TextInputBuilder>().addComponents(inputSexo);

        modal.addComponents(actionRowNome, actionRowNomeFaina, actionRowNumero, actionRowMatricula, actionRowSexo);
        await interaction.showModal(modal);
    }
}
