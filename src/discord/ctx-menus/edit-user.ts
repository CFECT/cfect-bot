import { ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, UserContextMenuCommandInteraction } from "discord.js";
import Database from "../../Database";
import { UserContextMenu } from "../registry/UserContextMenu";

export default class EditUserUCM extends UserContextMenu {
    constructor() {
        super("Editar utilizador");
    }

    public async execute(interaction: UserContextMenuCommandInteraction): Promise<void> {
        const user = interaction.targetUser;
        const discordId = user?.id;
        const member = interaction.guild?.members.cache.get(discordId as string);

        if (!member) {
            await interaction.reply({ content: "Não foi possível encontrar o utilizador.", flags: MessageFlags.Ephemeral });
            return;
        }

        const userDb = await Database.get("SELECT * FROM Users WHERE DiscordID = ?", [discordId]);
        if (!userDb) {
            await interaction.reply({ content: "Não foi possível encontrar o utilizador.", flags: MessageFlags.Ephemeral });
            return;
        }

        const modal = new ModalBuilder()
        .setTitle("Editar Utilizador")
        .setCustomId("editUserModal-" + discordId);

        const inputNome = new TextInputBuilder()
            .setLabel("Nome")
            .setCustomId("nome")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setValue(userDb.Nome)
            .setMaxLength(50);
        const actionRowNome = new ActionRowBuilder<TextInputBuilder>().addComponents(inputNome);

        const inputNomeFaina = new TextInputBuilder()
            .setLabel("Nome de Faina")
            .setCustomId("nome-faina")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setValue(userDb.NomeDeFaina)
            .setMaxLength(50);
        const actionRowNomeFaina = new ActionRowBuilder<TextInputBuilder>().addComponents(inputNomeFaina);

        const inputNumero = new TextInputBuilder()
            .setLabel("Número Mecanográfico")
            .setCustomId("numero")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setValue(userDb.NMec)
            .setMinLength(5)
            .setMaxLength(6)
        const actionRowNumero = new ActionRowBuilder<TextInputBuilder>().addComponents(inputNumero);

        const inputMatricula = new TextInputBuilder()
            .setLabel("Matrícula")
            .setCustomId("matricula")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setValue(userDb.Matricula)
            .setMinLength(1)
            .setMaxLength(2)
        const actionRowMatricula = new ActionRowBuilder<TextInputBuilder>().addComponents(inputMatricula);

        const inputSexo = new TextInputBuilder()
            .setLabel("Sexo")
            .setCustomId("sexo")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setValue(userDb.Sexo)
            .setMinLength(1)
            .setMaxLength(1)
        const actionRowSexo = new ActionRowBuilder<TextInputBuilder>().addComponents(inputSexo);

        modal.addComponents(actionRowNome, actionRowNomeFaina, actionRowNumero, actionRowMatricula, actionRowSexo);
        await interaction.showModal(modal);
    }
}
