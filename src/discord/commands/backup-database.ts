import type { CommandInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import { Command } from "../registry/Command";
import Constants from "../../Constants";
import Backups from "../managers/Backups";

export default class BackupDatabaseCommand extends Command {
    constructor() {
        super("backup-database", "Backs up the database");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            await Backups.backup(interaction.user);
        } catch (err) {
            await interaction.editReply({
                content: "An error occurred while backing up the database." + err,
            });
            return;
        }

        await interaction.editReply({
            content: `Backup sent to <#${Constants.BACKUPS.CHANNEL_ID}> successfully.`,
        });
    }
}
