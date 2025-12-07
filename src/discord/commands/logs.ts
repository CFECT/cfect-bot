import { AttachmentBuilder, ChatInputCommandInteraction, MessageFlags, Team } from "discord.js";
import { Command } from "../registry/Command";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import Duration from "../../Duration";

const SERVICE_NAME = "cfect-bot.service";

export default class LogsCommand extends Command {
    constructor() {
        super("logs", "Fetches the system logs for the bot service");
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.client.application.fetch();
        const owner = interaction.client.application.owner;

        if (!owner) {
            await interaction.reply({ content: "Could not find bot owner.", ephemeral: true });
            return;
        }

        if (owner instanceof Team) {
            if (owner.members.size === 0) {
                await interaction.reply({ content: "Could not find bot owner.", ephemeral: true });
                return;
            }
            if (!owner.members.has(interaction.user.id)) {
                await interaction.reply({ content: "You are not the bot owner.", ephemeral: true });
                return;
            }
        } else {
            if (owner.id !== interaction.user.id) {
                await interaction.reply({ content: "You are not the bot owner.", ephemeral: true });
                return;
            }
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const linesInput = interaction.options.getInteger("lines") ?? 0;
        const since = interaction.options.getString("since") ?? null;

        const tempFilePath = path.join(os.tmpdir(), `logs-${Date.now()}.txt`);
        const writeStream = fs.createWriteStream(tempFilePath);

        const args = ['-a', '-u', SERVICE_NAME, '--no-pager'];
        if (linesInput > 0) {
            args.push('-n', linesInput.toString());
        }

        if (since) {
            const duration = new Duration(since);
            if (isNaN(duration.fromNow.getTime())) {
                interaction.editReply(`Invalid duration format for 'since': ${since}`);
                return;
            }

            const sinceDate = new Date(Date.now() - duration.offset);
            const sinceString = `${sinceDate.getFullYear()}-${String(sinceDate.getMonth() + 1).padStart(2, '0')}-${String(sinceDate.getDate()).padStart(2, '0')} ${String(sinceDate.getHours()).padStart(2, '0')}:${String(sinceDate.getMinutes()).padStart(2, '0')}:${String(sinceDate.getSeconds()).padStart(2, '0')}`;

            args.push('--since', sinceString);
        }

        try {
            const child = spawn('journalctl', args);

            child.stdout.pipe(writeStream);

            await new Promise<void>((resolve, reject) => {
                child.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Process exited with code ${code}`));
                });

                child.on('error', (err) => reject(err));
                writeStream.on('error', (err) => reject(err));
            });

            const stats = fs.statSync(tempFilePath);
            if (stats.size === 0) {
                await interaction.editReply("No logs found. Check if the service name is correct.");
                fs.unlinkSync(tempFilePath);
                return;
            }

            const attachment = new AttachmentBuilder(tempFilePath, { name: 'system-logs.txt' });

            await interaction.editReply({
                content: `Here are the logs for **${SERVICE_NAME}** (${linesInput === 0 ? "All history" : `Last ${linesInput} lines`}):`,
                files: [attachment]
            });

            setTimeout(() => {
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            }, 5000);

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: `Failed to fetch logs.\nError: ${error instanceof Error ? error.message : "Unknown error"}`
            });

            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        }
    }
}
