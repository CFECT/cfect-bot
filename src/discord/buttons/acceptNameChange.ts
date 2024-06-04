import { ButtonInteraction, EmbedBuilder, GuildMember } from "discord.js";
import { Button } from "../registry/Button";
import Database from "../../Database";
import Constants from "../../Constants";
import Utils from "../../Utils";

export default class AcceptNameChange extends Button {
    constructor() {
        super("acceptNameChange-", true);
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
        if (!user.manageable) {
            await interaction.followUp({ content: "Não tenho permissão para alterar o nome do utilizador!", ephemeral: true });
            return;
        }

        await Database.run("UPDATE Users SET NomeDeFaina = ? WHERE DiscordID = ?", [nameChange.NomeNovo, nameChange.DiscordID]);
        await Database.run("DELETE FROM NameChanges WHERE ID = ?", [id]);
        const formattedName = await Utils.getFormattedName(nameChange.DiscordID, nameChange.NomeNovo);
        await user.setNickname(formattedName, "Mudança de nome efetuada pela Comissão de Faina");

        const originalEmbed = interaction.message.embeds[0].toJSON();
        const newEmbed = new EmbedBuilder(originalEmbed)
            .setColor(Constants.EMBED_COLORS.ACCEPTED)
            .setFooter({
                text: `Mudança de nome aceite por ${(interaction.member as GuildMember).displayName} (${interaction.user.id})`,
                iconURL: interaction.user.displayAvatarURL()
            });

        await user.send(`O teu pedido de mudança de nome foi aceite!\nNome alterado para: \`${formattedName}\`.`).catch(() => {});

        await interaction.update({ embeds: [newEmbed], components: [] });
        await interaction.followUp({ content: `Mudança de nome aceite!`, ephemeral: true});
    }
}
