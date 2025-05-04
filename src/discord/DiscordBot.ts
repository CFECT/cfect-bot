import { readdirSync } from "fs";
import { ActivityType, Client, IntentsBitField, Partials } from 'discord.js';
import MentionableSelectMenuRegistry from "./registry/MentionableSelectMenuRegistry";
import UserContextMenuRegistry from "./registry/UserContextMenuRegistry";
import CommandRegistry from "./registry/CommandRegistry";
import ButtonRegistry from "./registry/ButtonRegistry";
import ModalRegistry from "./registry/ModalRegistry";
import Database from "../Database";
import Reminders from "./managers/Reminders";
import Backups from "./managers/Backups";
import Enforcers from "./managers/Enforcers";

class DiscordBot {
    private client: Client;

    constructor() {
        const flags = IntentsBitField.Flags
        this.client = new Client({
            intents: [
                flags.Guilds,
                flags.GuildMembers,
                flags.MessageContent,
                flags.GuildMessages,
                flags.DirectMessages
            ],
            partials: [
                Partials.Channel,
                Partials.Message
            ]
        });
    }

    public async start(token: string): Promise<void> {
        this.registerEvents();
        await Database.init();
        await Reminders.init(this.client);
        await Enforcers.init(this.client);
        MentionableSelectMenuRegistry.registerMentionableSelectMenus();
        UserContextMenuRegistry.registerUserContextMenus();
        CommandRegistry.registerCommands();
        ButtonRegistry.registerButtons();
        ModalRegistry.registerModals();
        await this.client.login(token);
        if (process.env.BACKUP_ENABLED === "true")
            await Backups.init(this.client);
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
