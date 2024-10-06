import { Attachment, CommandInteraction, EmbedBuilder, Team } from "discord.js";
import { Command } from "../registry/Command";
import Constants from "../../Constants";
import Utils from "../../Utils";

export default class CompletarFainaBulkCommand extends Command {
    constructor() {
        super("completar-faina-bulk", "Completa a faina de vários utilizadores");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true });
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

        await interaction.editReply({ content: "File added to processing." });

        const fileAtt = interaction.options.get('ficheiro', true).attachment as Attachment;
        const fileUrl = fileAtt.url;

        const file = await fetch(fileUrl).catch(() => null);
        if (!file) {
            await interaction.editReply({ content: "Could not fetch file." });
            return;
        }

        const text = await file.text();

        const embed = new EmbedBuilder()
            .setTitle("Completar Faina")
            .setDescription("A marcar a faina de utilizadores como completa...")
            .setFields(
                { name: "Número Mecanográfico", value: "Pending...", inline: true },
                { name: "Utilizador", value: "Pending...", inline: true },
                { name: "Progresso", value: "Pending...", inline: true }
            )
            .setColor(Constants.EMBED_COLORS.UPDATE_IN_PROGRESS)
            .setTimestamp(Date.now());

        const message = await interaction.channel!.send({ embeds: [embed] });
        await Utils.completarFainaBulk(message, text);
    }
}
