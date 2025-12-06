import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CategoryChannel, ChatInputCommandInteraction, EmbedBuilder, GuildChannel, MessageFlags, ModalSubmitInteraction, Team, TextChannel, codeBlock } from "discord.js";
import { Modal } from "../registry/Modal";
import { Type } from "../../Type";
import { inspect } from "util";

export default class EvalModal extends Modal {
    constructor() {
        super("evalModal", false);
    }

    public async execute(interaction: ModalSubmitInteraction): Promise<void> {
        const values = interaction.fields.fields.map((field) => {
            return {
                name: field.customId,
                value: interaction.fields.getTextInputValue(field.customId),
            }
        });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const code = values.find((value) => value.name === "code")?.value;
        if (!code) {
            await interaction.editReply({ content: "Please provide code." });
            return;
        }
        const async = code.includes("await");
        const depth = (values.find((value) => value.name === "depth")?.value ?? 0) as number;

        let result;
        let type;
        let success = false;
        try {
            result = async ? await eval(`(async () => { ${code} })()`) : eval(code);
            type = new Type(result);

            if (typeof result !== "string") result = inspect(result, { depth });
            success = true;
        } catch (error: any) {
            result = error.stack || error.message || error;
            type = new Type(error);
        }

        if (result.length > 2000) {
            await interaction.editReply({
                files: [{
                    attachment: Buffer.from(result),
                    name: "output.txt"
                }]
            });
            return;
        }

        await type.check();

        const embed = new EmbedBuilder()
            .setAuthor({
                name: "CFECT",
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTitle(success ? "Evaluated successfully" : "An error occurred")
            .addFields({
                name: success ? "Result" : "Stack",
                value: codeBlock("ts", result)
            })
            .addFields({
                name: "Type",
                value: codeBlock("ts", type.toString())
            })
            .setColor(success ? "Green" : "Red");
        await interaction.editReply({ embeds: [embed] });
    }
}
