import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder, MessageFlags } from "discord.js";
import { Button } from "../registry/Button";
import Utils from "../../Utils";
import Constants from "../../Constants";

export default class UpdateMatriculaButton extends Button {
    constructor() {
        super("updateMatricula-", true);
    }

    public async execute(interaction: ButtonInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // const currentButton = interaction.message.components![0].components[0];
        // if (currentButton.type !== ComponentType.Button) return;

        const firstRow = interaction.message.components![0];

        // Type guard to ensure we have an ActionRow
        if (!firstRow || firstRow.type !== ComponentType.ActionRow) {
            await interaction.editReply({ content: "Erro ao obter os componentes da mensagem." });
            return;
        }

        const currentButton = firstRow.components[0];

        if (currentButton.type !== ComponentType.Button) {
            await interaction.editReply({ content: "Erro ao obter o botão." });
            return;
        }

        const member = await interaction.guild?.members.fetch(interaction.user.id);
        if (!member) {
            await interaction.editReply({ content: "Não foi possível encontrar o utilizador." });
            return;
        }

        const memberIsCF = member.roles.cache.some(role => role.id === Constants.ROLES.COMISSAO_DE_FAINA);
        if (!memberIsCF) {
            await interaction.editReply({ content: "Apenas a Comissão de Faina pode aprovar esta atualização de matrículas." });
            return;
        }

        const alreadyVoted = interaction.customId.split("-").slice(1);
        if (alreadyVoted.includes(interaction.user.id)) {
            await interaction.editReply({ content: "Já aprovaste esta atualização de matrículas." });
            return;
        }

        const currentButtonText = currentButton.label;
        if (!currentButtonText) {
            await interaction.editReply({ content: "Erro ao obter o texto do botão." });
            return;
        }

        const votes = currentButtonText.split(" ").pop();
        if (!votes) {
            await interaction.editReply({ content: "Erro ao obter o número de votos." });
            return;
        }

        const currentVotes = parseInt(votes.split("/")[0]);
        const requiredVotes = parseInt(votes.split("/")[1]);

        const newVotes = `${currentVotes + 1}/${requiredVotes}`;
        const newLabel = currentButtonText.replace(votes, newVotes);

        if (currentVotes + 1 >= requiredVotes) {
            const embed = new EmbedBuilder()
                .setTitle("Atualização de matrículas")
                .setDescription("A atualizar as matrículas de todos os utilizadores...")
                .setFields(
                    { name: "A atualizar", value: "Pending...", inline: true },
                    { name: "Progresso", value: "Pending...", inline: true }
                )
                .setColor(Constants.EMBED_COLORS.UPDATE_IN_PROGRESS)
                .setTimestamp(Date.now());

            await interaction.message.edit({ content: "", embeds: [embed], components: [] });
            await interaction.editReply({ content: "Foste a última aprovação! A atualizar as matrículas de todos os utilizadores..." });
            await Utils.updateMatriculas(interaction.message);
        } else {
            const newButton = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(interaction.customId + "-" + interaction.user.id)
                        .setLabel(newLabel)
                        .setStyle(ButtonStyle.Success)
                        .setEmoji("✅")
                );

            await interaction.message.edit({ components: [newButton] });
            await interaction.editReply({ content: "Aprovaste a atualização de matrículas!" });
        }
    }
}
