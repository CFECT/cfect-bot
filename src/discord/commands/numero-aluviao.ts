import { ChatInputCommandInteraction, CommandInteraction, MessageFlags } from "discord.js";
import { Command } from "../registry/Command";
import Database from "../../Database";
import Utils from "../../Utils";

export default class NumeroAluviaoCommand extends Command {
    constructor() {
        super("numero-aluviao", "Define o número de aluvião de um utilizador");
    }

    public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const user = interaction.options.get('utilizador')?.user;
        const number = interaction.options.get('numero')?.value;
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

        await Database.run("UPDATE Users SET NumeroAluviao = ? WHERE DiscordID = ?", [number, user?.id]);

        await Utils.updateNickname(member);

        await interaction.editReply({ content: `Número de faina de ${user} alterado para \`${number}\`!` });
    }
}
