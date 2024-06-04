import { ButtonInteraction, EmbedBuilder, GuildMember } from "discord.js";
import { Button } from "../registry/Button";
import Database from "../../Database";
import Constants from "../../Constants";
import Utils from "../../Utils";

export default class DeclineNameChange extends Button {
    constructor() {
        super("declineNameChange-", true);
    }

    public async execute(interaction: ButtonInteraction): Promise<void> {
        const id = parseInt(interaction.customId.split("-")[1]);
        const nameChange = await Database.get("SELECT * FROM NameChanges WHERE ID = ?", [id]);
        if (!nameChange) {
            await interaction.channel?.send("Pedido de mudança de nome não encontrado!");
            return;
        }
        const user = await interaction.guild?.members.fetch(nameChange.DiscordID);
        if (!user) {
            await interaction.followUp({ content: "Utilizador não encontrado!", ephemeral: true });
            return;
        }

        const formattedName = Utils.getFormattedName(nameChange.DiscordID, nameChange.NomeNovo);
        await Database.run("DELETE FROM NameChanges WHERE ID = ?", [id]);

        const originalEmbed = interaction.message.embeds[0].toJSON();
        const newEmbed = new EmbedBuilder(originalEmbed)
            .setColor(Constants.EMBED_COLORS.DENIED)
            .setFooter({
                text: `Mudança de nome rejeitada por ${(interaction.member as GuildMember).displayName} (${interaction.user.id})`,
                iconURL: interaction.user.displayAvatarURL()
            });

        await user.send(`O teu pedido de mudança de nome para \`${formattedName}\` foi rejeitado!`).catch(() => { });

        await interaction.update({ embeds: [newEmbed], components: [] });
        await interaction.followUp({ content: `Mudança de nome rejeitada!`, ephemeral: true });
    }
}
