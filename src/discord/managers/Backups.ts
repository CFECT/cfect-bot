import { Client, TextBasedChannel, TextChannel, User } from "discord.js";
import { resolve } from "path";

import Constants from "../../Constants";
import Logger from "../../Logger";

class Backups {
    client: Client | null = null;

    public async init(client: Client) {
        this.client = client;
        this.backup();
    }

    public async backup(creator?: User | null) {
        const channel = await this.client?.channels.fetch(Constants.BACKUPS.CHANNEL_ID) as TextChannel;
        if (!channel) return;

        const now = Math.floor(Date.now() / 1000);

        await channel.send({
            content: `> **${creator ? "Manual" : "Automatic"} backup created ${creator ? "by " + creator.toString() : ""} at <t:${now}:F> (<t:${now}:R>)**`,
            files: [{
                attachment: resolve(__dirname, "../../..", "database.db"),
                name: "database.db"
            }]
        }).catch((err) => {
            Logger.error("An error occurred while sending the backup. " + err);
            throw err;
        });

        setTimeout(this.backup.bind(this), Constants.BACKUPS.INTERVAL_MINUTES * 60 * 1000);
    }
}

export default new Backups;
