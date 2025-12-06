import { ChatInputCommandInteraction, MessageFlags, Team } from "discord.js";
import { Command } from "../registry/Command";
import Database from "../../Database";

export default class DeleteUserCommand extends Command {
    constructor() {
        super("delete-user", "Delete a user from the database.");
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.client.application.fetch();
        const owner = interaction.client.application.owner;
        if (!owner) {
            await interaction.reply("Could not find bot owner.");
            return;
        }

        if (owner instanceof Team) {
            if (owner.members.size === 0) {
                await interaction.reply("Could not find bot owner.");
                return;
            }
            if (!owner.members.has(interaction.user.id)) {
                await interaction.reply("You are not the bot owner.");
                return;
            }
        } else {
            if (owner.id !== interaction.user.id) {
                await interaction.reply("You are not the bot owner.");
                return;
            }
        }

        const nmec = interaction.options.getString("nmec");
        const discordId = interaction.options.getString("discord-id");

        if (!nmec && !discordId) {
            await interaction.reply({ content: "You must provide either a nmec or a discord-id.", flags: MessageFlags.Ephemeral });
            return;
        }

        const userDb = await Database.get("SELECT * FROM Users WHERE NMec = ? OR DiscordID = ?", [nmec, discordId]);
        if (!userDb) {
            await interaction.reply({ content: "User not found.", flags: MessageFlags.Ephemeral });
            return;
        }

        await Database.run("DELETE FROM Users WHERE NMec = ? OR DiscordID = ?", [nmec, discordId]);
        await interaction.reply({ content: `User with NMec ${userDb.NMec} and DiscordID ${userDb.DiscordID} has been deleted.`, flags: MessageFlags.Ephemeral });
    }
}

