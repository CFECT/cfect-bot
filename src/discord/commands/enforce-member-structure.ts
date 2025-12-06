import { CommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { Command } from "../registry/Command";
import Constants from "../../Constants";
import Utils from "../../Utils";

export default class EnforceMemberStructureCommand extends Command {
    constructor() {
        super("enforce-member-structure", "Atualiza os nomes e roles dos utilizadores.");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const embed = new EmbedBuilder()
            .setTitle("Atualização de dados")
            .setDescription("Os nomes e roles dos utilizadores estão a ser atualizados.")
            .setColor(Constants.EMBED_COLORS.ACCEPTED)
            .setTimestamp();

        for await (const member of Utils.enforceMemberStructure(interaction.guild!)) {
            if (member) {
                embed.setFields({
                    name: "A atualizar...",
                    value: `${member} - ${member.user.username} (${member.id})`,
                    inline: false
                })
                await interaction.editReply({ embeds: [embed] });
            }
        }

        embed.setDescription("Os nomes e roles dos utilizadores foram atualizados.")
            .setColor(Constants.EMBED_COLORS.ACCEPTED)
            .setFields()
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}
