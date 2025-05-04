import { Client } from "discord.js";
import Logger from "../../Logger";
import Utils from "../../Utils";
import Constants from "../../Constants";

class Enforcers {
    client: Client | null = null;

    public async init(client: Client) {
        this.client = client;
        setInterval(this.enforceMemberStructure.bind(this), 1000 * 60 * 60 * 24); // 24 hours
        Logger.log('Enforcers initialized.');
    }

    async enforceMemberStructure() {
        const guild = await this.client?.guilds.fetch(Constants.GUILD_ID);
        Utils.enforceMemberStructure(guild!);
    }

}

export default new Enforcers;
