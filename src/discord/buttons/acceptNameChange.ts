import { ButtonInteraction, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
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
            await interaction.followUp({ content: "Pedido de mudança de nome não encontrado!", flags: MessageFlags.Ephemeral });
            return;
        }
        const user = await interaction.guild?.members.fetch(nameChange.DiscordID);
        if (!user) {
            await interaction.followUp({ content: "Utilizador não encontrado!", flags: MessageFlags.Ephemeral });
            return;
        }
        if (!user.manageable) {
            await interaction.followUp({ content: "Não tenho permissão para alterar o nome do utilizador!", flags: MessageFlags.Ephemeral });
            return;
        }

        await Database.run("UPDATE Users SET NomeDeFaina = ? WHERE DiscordID = ?", [nameChange.NomeNovo, nameChange.DiscordID]);
        await Database.run("DELETE FROM NameChanges WHERE ID = ?", [id]);
        const formattedName = await Utils.getFormattedName(user, nameChange.NomeNovo);
        await user.setNickname(formattedName, "Mudança de nome efetuada pela Comissão de Faina");

        const originalEmbed = interaction.message.embeds[0].toJSON();
        const newEmbed = new EmbedBuilder(originalEmbed)
            .setColor(Constants.EMBED_COLORS.ACCEPTED)
            .setFooter({
                text: `Mudança de nome aceite por ${(interaction.member as GuildMember).displayName} (${interaction.user.id})`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp(Date.now());

        const dmEmbed = new EmbedBuilder()
            .setTitle("Mudança de Nome Aceite")
            .setColor(Constants.EMBED_COLORS.ACCEPTED)
            .setDescription(`O teu pedido de mudança de nome para \`${formattedName}\` foi aceite pela Comissão de Faina.`);

        await user.send({ embeds: [dmEmbed] }).catch(() => {});

        await interaction.update({ embeds: [newEmbed], components: [] });
        await interaction.followUp({ content: `Mudança de nome aceite!`, flags: MessageFlags.Ephemeral});
    }
}
