import { CommandInteraction } from "discord.js";
import { Command } from "../registry/Command";
import Database from "../../Database";
import Constants from "../../Constants";
import Utils from "../../Utils";

export default class CompletarFainaCommand extends Command {
    constructor() {
        super("completar-faina", "Marca/desmarca a faina de um utilizador como completa");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true});

        const user = interaction.options.get('utilizador')?.user;
        const discordId = user?.id;
        const member = interaction.guild?.members.cache.get(discordId as string);

        if (!member) {
            await interaction.editReply({ content: "Não foi possível encontrar o utilizador." });
            return;
        }

        const userDb = await Database.get("SELECT * FROM Users WHERE DiscordID = ?", [user?.id]);
        if (!userDb) {
            await interaction.editReply({ content: "Não foi possível encontrar o utilizador." });
            return;
        }

        const fainaCompleta = userDb.FainaCompleta;
        await Database.run("UPDATE Users SET FainaCompleta = ? WHERE DiscordID = ?", [!fainaCompleta, user?.id]);

        if (fainaCompleta) {
            await member.roles.remove(Constants.ROLES.VETERANO);
            await member.roles.remove(Constants.ROLES.MESTRE);
            await member.roles.add(Constants.ROLES.ALUVIAO);
        } else {
            await member.roles.remove(Constants.ROLES.ALUVIAO);
            await member.roles.add(Constants.ROLES.VETERANO);
            if (userDb.Matricula >= 5)
                await member.roles.add(Constants.ROLES.MESTRE);
        }

        await Utils.updateNickname(member);

        await interaction.editReply({ content: `Faina de ${user} marcada como ${fainaCompleta ? "incompleta" : "completa"}!` });
    }
}
