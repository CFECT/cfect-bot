import { readdirSync } from "fs";
import { resolve } from "path";
import { Collection } from "discord.js";
import { UserSelectMenu } from "./UserSelectMenu";
import Logger from "../../Logger";

class UserSelectMenuRegistry {
    private userSelectMenus: Collection<string, UserSelectMenu> = new Collection();

    private get userSelectMenusDir(): string {
        return resolve(__dirname, "..", "userSelectMenus");
    }

    private getUserSelectMenuFile(name: string): string {
        return resolve(this.userSelectMenusDir, name);
    }

    public registerUserSelectMenus() {
        // Read all files in the userSelectMenus folder
        // Each file has a run function that takes in the interaction
        const registeredUserSelectMenus: string[] = [];
        readdirSync(this.userSelectMenusDir).forEach((file) => {
            const userSelectMenuFile = require(this.getUserSelectMenuFile(file));
            if (!userSelectMenuFile.default) return;
            const userSelectMenu = new userSelectMenuFile.default();
            if (userSelectMenu instanceof UserSelectMenu) {
                const userSelectMenuName = userSelectMenu.customId;
                if (registeredUserSelectMenus.includes(userSelectMenuName)) throw new Error(`Duplicate userSelectMenu name: ${userSelectMenuName}`);
                registeredUserSelectMenus.push(userSelectMenuName);
                this.setUserSelectMenu(userSelectMenuName, userSelectMenu);
            }
        });
        Logger.info(`Registered ${registeredUserSelectMenus.length} userSelectMenus: ${registeredUserSelectMenus.join(", ")}`);
    }

    private setUserSelectMenu(userSelectMenuCustomId: string, userSelectMenu: UserSelectMenu): void {
        this.userSelectMenus.set(userSelectMenuCustomId, userSelectMenu);
    }

    public getUserSelectMenu(customId: string): UserSelectMenu | undefined {
        const userSelectMenu = this.userSelectMenus.find((userSelectMenu) => (userSelectMenu.customId === customId) || (userSelectMenu.startsWith && customId.startsWith(userSelectMenu.customId)));
        return userSelectMenu;
    }

    public getUserSelectMenus(): Collection<string, UserSelectMenu> {
        return this.userSelectMenus;
    }
}

export default new UserSelectMenuRegistry();
