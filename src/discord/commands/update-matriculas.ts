import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, InteractionEditReplyOptions, InteractionReplyOptions, Team } from "discord.js";
import { Command } from "../registry/Command";
import Constants from "../../Constants";

export default class UpdateMatriculasCommand extends Command {
    constructor() {
        super("update-matriculas", "Atualiza a matrícula de todos os utilizadores");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        await interaction.client.application.fetch();
        const owner = interaction.client.application.owner;
        if (!owner) {
            await interaction.editReply({ content: "Could not find bot owner." });
            return;
        }

        if (owner instanceof Team) {
            if (owner.members.size === 0) {
                await interaction.editReply({ content: "Could not find bot owner." });
                return;
            }
            if (!owner.members.has(interaction.user.id)) {
                await interaction.editReply({ content: "You are not the bot owner." });
                return;
            }
        } else {
            if (owner.id !== interaction.user.id) {
                await interaction.editReply({ content: "You are not the bot owner." });
                return;
            }
        }

        const cfRole = await interaction.guild?.roles.fetch(Constants.ROLES.COMISSAO_DE_FAINA);
        if (!cfRole) {
            await interaction.editReply({ content: "Could not find Comissão de Faina role." });
            return;
        }

        const requiredVotes = Math.ceil(cfRole.members.size / 3);
        const votes = `0/${requiredVotes}`;

        const newButton = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("updateMatricula-")
                    .setLabel(`Aprovar ${votes}`)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji("✅")
            );

        const message: InteractionEditReplyOptions = {
            content: `Votação para atualização de matrículas iniciada por ${interaction.user}. Aprovações necessárias: ${requiredVotes}`,
            components: [newButton]
        }

        await interaction.editReply(message);
    }
}
