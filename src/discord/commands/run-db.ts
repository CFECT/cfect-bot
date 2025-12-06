import { InteractionEditReplyOptions, MessageFlags, Team, type ChatInputCommandInteraction, type InteractionReplyOptions } from "discord.js";
import { Command } from "../registry/Command";
import Database from "../../Database";

export default class RunDbCommand extends Command {
    constructor() {
        super("run-db", "Runs a command on the database");
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        await interaction.client.application.fetch();
        const owner = interaction.client.application.owner;
        if (!owner) {
            await interaction.editReply("Could not find bot owner.");
            return;
        }

        if (owner instanceof Team) {
            if (owner.members.size === 0) {
                await interaction.editReply("Could not find bot owner.");
                return;
            }
            if (!owner.members.has(interaction.user.id)) {
                await interaction.editReply("You are not the bot owner.");
                return;
            }
        } else {
            if (owner.id !== interaction.user.id) {
                await interaction.editReply("You are not the bot owner.");
                return;
            }
        }

        const subcommand = interaction.options.getSubcommand(true);
        if (subcommand === "get") return this.executeGet(interaction);
        else if (subcommand === "run") return this.executeRun(interaction);
    }

    public async executeGet(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const query = interaction.options.getString("query", true);
        const results = await Database.getAll(query);

        const messageToSend: InteractionEditReplyOptions = {
        }

        if (results.length > 0) {
            messageToSend.content = "Here are the results:";
            messageToSend.files = [{
                attachment: Buffer.from(JSON.stringify(results, null, 2)),
                name: "results.json"
            }];
        } else {
            messageToSend.content = "No results found.";
        }

        await interaction.editReply(messageToSend);
    }

    public async executeRun(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const query = interaction.options.getString("query", true);
        let error: any = null;
        await Database.run(query).catch((err) => {
            error = err;
        });

        const messageToSend: InteractionEditReplyOptions = {
        }

        if (error) {
            messageToSend.content = `An error occurred: ${error.message}`;
        } else {
            messageToSend.content = "Query ran successfully.";
        }

        await interaction.editReply(messageToSend);
    }
}
