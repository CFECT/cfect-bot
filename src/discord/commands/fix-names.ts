import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../registry/Command";
import Database from "../../Database";
import Constants from "../../Constants";
import Utils from "../../Utils";

export default class FixNamesCommand extends Command {
    constructor() {
        super("fix-names", "Corrige os nomes dos utilizadores no servidor");
    }

    public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true });

        let count = 0;
        const users = await interaction.guild?.members.fetch();
        for (const user of users?.values() || []) {
            if (user.user.bot) continue;
            if (!user.manageable) continue;
            if (user.roles.cache.size === 0) continue;

            const userDb = await Database.get("SELECT * FROM Users WHERE DiscordID = ?", [user.id]);
            if (!userDb) continue;

            const formattedName = await Utils.getFormattedName(user);
            if (user.nickname === formattedName) continue;
            await user.setNickname(formattedName, "Correção de nomes automática");
            count++;
        }

        const embed = new EmbedBuilder()
            .setTitle("Mudança de Nomes")
            .setDescription(`Foram corrigidos os nomes de ${count} utilizadores.`)
            .setColor(Constants.EMBED_COLORS.ACCEPTED);

        await interaction.editReply({ embeds: [embed] });
    }
}
