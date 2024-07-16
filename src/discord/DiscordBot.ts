import { readdirSync } from "fs";
import { ActivityType, Client, IntentsBitField } from 'discord.js';
import UserContextMenuRegistry from "./registry/UserContextMenuRegistry";
import CommandRegistry from "./registry/CommandRegistry";
import ButtonRegistry from "./registry/ButtonRegistry";
import ModalRegistry from "./registry/ModalRegistry";
import Database from "../Database";
import Reminders from "./extras/Reminders";

class DiscordBot {
    private client: Client;

    constructor() {
        this.client = new Client({
            intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers]
        });
    }

    public async start(token: string): Promise<void> {
        this.registerEvents();
        UserContextMenuRegistry.registerUserContextMenus();
        CommandRegistry.registerCommands();
        ButtonRegistry.registerButtons();
        ModalRegistry.registerModals();
        Database.init();
        Reminders.init(this.client);
        await this.client.login(token);
        this.client.user?.setPresence({ activities: [{ name: "aluviões a encher :>", type: ActivityType.Watching }] });
    }

    private registerEvents() {
        readdirSync(__dirname + "/events").forEach((file) => {
            const event = require(__dirname + `/events/${file}`);
            this.client.on(file.split(".")[0]!, (...args) => event.run(this.client, ...args));
        });
    }
}

export default DiscordBot;
