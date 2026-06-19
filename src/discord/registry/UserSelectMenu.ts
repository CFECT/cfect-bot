import type { UserSelectMenuInteraction } from "discord.js";

export abstract class UserSelectMenu {
    public readonly customId: string;
    public abstract execute(interaction: UserSelectMenuInteraction): Promise<void>;

    public readonly startsWith: boolean;

    constructor(customId: string, startsWith: boolean = false) {
        this.customId = customId;
        this.startsWith = startsWith;
    }
}
