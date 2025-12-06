import type { Client } from "discord.js";
import Logger from "../../Logger";

export function run(client: Client) {
    Logger.info('Bot is ready, logged in as ' + client.user?.tag);
}
