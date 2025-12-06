import { ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, UserContextMenuCommandInteraction } from "discord.js";
import Database from "../../Database";
import { UserContextMenu } from "../registry/UserContextMenu";

export default class NumeroAluviaoUCM extends UserContextMenu {
    constructor() {
        super("Número de aluvião");
    }

    public async execute(interaction: UserContextMenuCommandInteraction): Promise<void> {
        const user = interaction.targetUser;
        const discordId = user?.id;

        const userDb = await Database.get("SELECT * FROM Users WHERE DiscordID = ?", [user?.id]);
        if (!userDb) {
            await interaction.reply({ content: "Não foi possível encontrar o utilizador.", flags: MessageFlags.Ephemeral });
            return;
        }

        const modal = new ModalBuilder()
        .setTitle("Alterar número de aluvião")
        .setCustomId("numeroAluviao-" + discordId);

        const inputNome = new TextInputBuilder()
            .setLabel("Novo número de aluvião")
            .setCustomId("number")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setValue(userDb.NumeroAluviao == "?" ? "" : userDb.NumeroAluviao);
        const actionRowNumero = new ActionRowBuilder<TextInputBuilder>().addComponents(inputNome);

        modal.addComponents(actionRowNumero);
        await interaction.showModal(modal);
    }
}
